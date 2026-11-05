#!/usr/bin/env python3
"""motor/audit/cv_engine.py — Motor de imagem Tier 1 (fallback Python 3 + PIL).

Usado por motor/audit/engine.js quando o pacote npm `sharp` não está instalado.
Usa apenas Pillow (sem numpy) para funcionar em qualquer Linux com python3-pil.

Subcomandos:
  decode  --width W --height H IMG...      -> stdout: bytes RGB crus (W*H*3 por imagem, em ordem)
  encode  --in IMG --out JPG --max-width W --max-bytes N
                                            -> JPEG reduzido até caber em N bytes; stdout: JSON
  sheet   --spec SPEC.json                  -> prancha anotada (ver contact-sheet.js); stdout: JSON
  probe                                     -> stdout: JSON com versão do Pillow
"""

import argparse
import io
import json
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - ambiente sem Pillow
    sys.stderr.write("Pillow (PIL) não encontrado. Instale com: sudo apt install python3-pil\n")
    sys.exit(3)

RESAMPLE = Image.Resampling.BILINEAR if hasattr(Image, "Resampling") else Image.BILINEAR
RESAMPLE_HQ = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def carregar_fonte(tamanho):
    for caminho in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(caminho, tamanho)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def abrir_rgb(caminho):
    img = Image.open(caminho)
    if img.mode != "RGB":
        fundo = Image.new("RGB", img.size, (0, 0, 0))
        if img.mode in ("RGBA", "LA") or "transparency" in img.info:
            img = img.convert("RGBA")
            fundo.paste(img, mask=img.split()[-1])
            img = fundo
        else:
            img = img.convert("RGB")
    return img


def cmd_decode(args):
    saida = sys.stdout.buffer
    for caminho in args.imagens:
        img = abrir_rgb(caminho).resize((args.width, args.height), RESAMPLE)
        saida.write(img.tobytes())
    saida.flush()


def cmd_encode(args):
    img = abrir_rgb(args.entrada)
    largura = min(args.max_width, img.width)
    qualidade = 85
    dados = b""
    while True:
        altura = max(1, round(img.height * largura / img.width))
        reduzida = img.resize((largura, altura), RESAMPLE_HQ) if largura != img.width else img
        buf = io.BytesIO()
        reduzida.save(buf, format="JPEG", quality=qualidade, optimize=True)
        dados = buf.getvalue()
        if len(dados) <= args.max_bytes or (largura <= 320 and qualidade <= 45):
            break
        if qualidade > 55:
            qualidade -= 10
        else:
            largura = int(largura * 0.8)
    with open(args.saida, "wb") as f:
        f.write(dados)
    print(json.dumps({"ok": True, "bytes": len(dados), "largura": reduzida.width, "altura": reduzida.height, "qualidade": qualidade}))


def cor(hex_str, alpha=255):
    h = hex_str.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


def cmd_sheet(args):
    with open(args.spec, "r", encoding="utf-8") as f:
        spec = json.load(f)

    tile_w = int(spec["tileWidth"])
    tile_h = int(spec["tileHeight"])
    colunas = int(spec["columns"])
    header_h = int(spec.get("headerHeight", 56))
    gap = int(spec.get("gap", 12))
    titulo_h = int(spec.get("titleHeight", 0))
    tiles = spec["tiles"]
    linhas = max(1, (len(tiles) + colunas - 1) // colunas)
    larg_total = colunas * tile_w + (colunas + 1) * gap
    alt_total = titulo_h + linhas * (tile_h + header_h) + (linhas + 1) * gap

    folha = Image.new("RGB", (larg_total, alt_total), (12, 14, 20))
    draw = ImageDraw.Draw(folha)
    fonte_header = carregar_fonte(max(12, header_h // 3))
    fonte_badge = carregar_fonte(max(11, header_h // 4))

    if titulo_h:
        fonte_titulo = carregar_fonte(max(14, titulo_h // 2))
        draw.text((gap, titulo_h // 4), spec.get("title", ""), font=fonte_titulo, fill=(235, 238, 245))

    escala_x = tile_w / float(spec.get("sourceWidth", 1080))
    escala_y = tile_h / float(spec.get("sourceHeight", 1920))

    for i, tile in enumerate(tiles):
        lin, col = divmod(i, colunas)
        x0 = gap + col * (tile_w + gap)
        y0 = titulo_h + gap + lin * (tile_h + header_h + gap)

        status_cor = cor(tile.get("statusColor", "#22c55e"))
        draw.rectangle([x0, y0, x0 + tile_w - 1, y0 + header_h - 1], fill=(24, 28, 38))
        draw.rectangle([x0, y0, x0 + 8, y0 + header_h - 1], fill=status_cor[:3])
        draw.text((x0 + 16, y0 + 6), tile.get("label", ""), font=fonte_header, fill=(235, 238, 245))
        draw.text((x0 + 16, y0 + header_h // 2 + 4), tile.get("sublabel", ""), font=fonte_badge, fill=status_cor[:3])

        img = abrir_rgb(tile["path"]).resize((tile_w, tile_h), RESAMPLE_HQ).convert("RGBA")
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)
        for zona in spec.get("zones", []):
            violada = zona["id"] in tile.get("violatedZones", [])
            preenchimento = cor(zona.get("color", "#ef4444"), 70 if violada else 34)
            borda = cor(zona.get("color", "#ef4444"), 230 if violada else 140)
            r = [
                int(zona["x"] * escala_x),
                int(zona["y"] * escala_y),
                int((zona["x"] + zona["w"]) * escala_x) - 1,
                int((zona["y"] + zona["h"]) * escala_y) - 1,
            ]
            odraw.rectangle(r, fill=preenchimento, outline=borda, width=3 if violada else 1)
        img = Image.alpha_composite(img, overlay).convert("RGB")
        folha.paste(img, (x0, y0 + header_h))
        draw.rectangle([x0, y0 + header_h, x0 + tile_w - 1, y0 + header_h + tile_h - 1], outline=status_cor[:3], width=3)

    folha.save(spec["output"], format="JPEG", quality=int(spec.get("quality", 85)), optimize=True)
    print(json.dumps({"ok": True, "output": spec["output"], "largura": larg_total, "altura": alt_total}))


def cmd_probe(_args):
    import PIL

    print(json.dumps({"ok": True, "engine": "python-pil", "versao": PIL.__version__}))


def main():
    parser = argparse.ArgumentParser(description="Motor de imagem Tier 1 (Python/PIL) do Motor 2.0")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_dec = sub.add_parser("decode")
    p_dec.add_argument("--width", type=int, required=True)
    p_dec.add_argument("--height", type=int, required=True)
    p_dec.add_argument("imagens", nargs="+")
    p_dec.set_defaults(func=cmd_decode)

    p_enc = sub.add_parser("encode")
    p_enc.add_argument("--in", dest="entrada", required=True)
    p_enc.add_argument("--out", dest="saida", required=True)
    p_enc.add_argument("--max-width", type=int, default=2048)
    p_enc.add_argument("--max-bytes", type=int, default=900_000)
    p_enc.set_defaults(func=cmd_encode)

    p_sheet = sub.add_parser("sheet")
    p_sheet.add_argument("--spec", required=True)
    p_sheet.set_defaults(func=cmd_sheet)

    p_probe = sub.add_parser("probe")
    p_probe.set_defaults(func=cmd_probe)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
