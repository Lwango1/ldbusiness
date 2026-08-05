import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Optional, Literal

from config import (
    ProductData, BannerFormat, BANNER_FORMATS, PALETTE,
    FONT_HEADING, FONT_BODY, FONT_BOLD, FONT_LIGHT,
    PUBLIC_IMAGES_DIR, OUTPUT_DIR, DEFAULT_BRAND_NAME, DEFAULT_TAGLINE,
)

TemplateName = Literal["luxury", "modern", "minimal", "sale", "social"]


def _load_image(path: str) -> Optional[Image.Image]:
    if not os.path.exists(path):
        return None
    try:
        return Image.open(path).convert("RGBA")
    except Exception:
        return None


def _make_gradient(draw: ImageDraw, size, colors, vertical=True):
    w, h = size
    steps = len(colors) - 1
    for i in range(steps):
        r1, g1, b1, a1 = colors[i]
        r2, g2, b2, a2 = colors[i + 1]
        for j in range(h // steps):
            y = i * (h // steps) + j
            t = j / (h // steps) if (h // steps) > 0 else 0
            r = int(r1 + (r2 - r1) * t)
            g = int(g1 + (g2 - g1) * t)
            b = int(b1 + (b2 - b1) * t)
            a = int(a1 + (a2 - a1) * t)
            if vertical:
                draw.line([(0, y), (w, y)], fill=(r, g, b, a))
            else:
                draw.line([(y, 0), (y, h)], fill=(r, g, b, a))


def _draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def _fit_text(
    draw: ImageDraw,
    text: str,
    font_path: str,
    max_width: int,
    max_height: int,
    size_step: int = 4,
    min_size: int = 12,
    max_size: int = 120,
) -> ImageFont.FreeTypeFont:
    size = max_size
    while size >= min_size:
        font = ImageFont.truetype(font_path, size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        if tw <= max_width and th <= max_height:
            return font
        size -= size_step
    return ImageFont.truetype(font_path, min_size)


def _wrap_text(text: str, max_chars: int) -> str:
    words = text.split()
    lines = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 <= max_chars:
            current += " " + word if current else word
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return "\n".join(lines)


class AdGenerator:
    def __init__(self, product: ProductData):
        self.product = product

    def _product_image_path(self) -> str:
        if self.product.image.startswith("/images/"):
            return os.path.join(PUBLIC_IMAGES_DIR, self.product.image.replace("/images/", ""))
        if self.product.image.startswith("images/"):
            return os.path.join(PUBLIC_IMAGES_DIR, self.product.image.replace("images/", ""))
        if os.path.exists(self.product.image):
            return self.product.image
        return os.path.join(PUBLIC_IMAGES_DIR, self.product.image)

    def generate(self, fmt: BannerFormat, template: TemplateName = "luxury") -> Optional[Image.Image]:
        canvas = Image.new("RGBA", (fmt.width, fmt.height), (0, 0, 0, 255))
        draw = ImageDraw.Draw(canvas)

        if template == "luxury":
            canvas = self._template_luxury(fmt, draw)
        elif template == "modern":
            canvas = self._template_modern(fmt, draw)
        elif template == "minimal":
            canvas = self._template_minimal(fmt, draw)
        elif template == "sale":
            canvas = self._template_sale(fmt, draw)
        elif template == "social":
            canvas = self._template_social(fmt, draw)

        return canvas

    def _apply_bg_gradient(self, draw: ImageDraw, size, palette="dark"):
        if palette == "gold":
            colors = [
                (20, 15, 10, 255),
                (40, 30, 15, 255),
                (60, 45, 20, 255),
            ]
        elif palette == "navy":
            colors = [
                (10, 15, 35, 255),
                (15, 25, 55, 255),
                (25, 35, 70, 255),
            ]
        else:
            colors = [
                (10, 10, 10, 255),
                (15, 15, 22, 255),
                (22, 22, 30, 255),
            ]
        _make_gradient(draw, size, colors, vertical=True)

    def _place_product_image(self, canvas: Image.Image, fmt: BannerFormat) -> Image.Image:
        img_path = self._product_image_path()
        product_img = _load_image(img_path)
        if product_img is None:
            return canvas

        if fmt.name in ("hero", "carousel", "landscape"):
            img_w = int(fmt.height * 0.85)
            product_img = product_img.resize((img_w, img_w), Image.LANCZOS)

            mask = Image.new("L", (img_w, img_w), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse([(0, 0), (img_w, img_w)], fill=255)

            x = fmt.width - img_w + int(img_w * 0.15)
            y = (fmt.height - img_w) // 2
            canvas.paste(product_img, (x, y), mask)
        elif fmt.name in ("popup", "story"):
            img_w = fmt.width
            product_img = product_img.resize((img_w, img_w), Image.LANCZOS)
            x = 0
            y = int(fmt.height * 0.08)
            canvas.paste(product_img, (x, y))
        elif fmt.name in ("sidebar",):
            img_w = int(fmt.width * 0.8)
            product_img = product_img.resize((img_w, img_w), Image.LANCZOS)
            x = (fmt.width - img_w) // 2
            y = int(fmt.height * 0.25)
            mask = Image.new("L", (img_w, img_w), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse([(0, 0), (img_w, img_w)], fill=255)
            canvas.paste(product_img, (x, y), mask)
        elif fmt.name in ("square",):
            margin = int(fmt.width * 0.05)
            img_size = fmt.width - 2 * margin
            product_img = product_img.resize((img_size, img_size), Image.LANCZOS)
            x = margin
            y = margin
            canvas.paste(product_img, (x, y))

        return canvas

    def _add_text_overlay(
        self,
        draw: ImageDraw,
        fmt: BannerFormat,
        lines: list,
        anchor_y: int,
        align: str = "left",
        x_margin: Optional[int] = None,
    ):
        if x_margin is None:
            x_margin = max(int(fmt.width * 0.06), 20)

        if fmt.name == "story":
            x_margin = int(fmt.width * 0.08)

        current_y = anchor_y

        for item in lines:
            text = item.get("text", "")
            if not text:
                current_y += item.get("spacing", 10)
                continue

            font_key = item.get("font", "body")
            font_size = item.get("size", 20)
            color = item.get("color", (255, 255, 255, 255))
            max_width = fmt.width - 2 * x_margin
            spacing = item.get("spacing", 8)

            font_path_map = {
                "heading": FONT_HEADING,
                "bold": FONT_BOLD,
                "body": FONT_BODY,
                "light": FONT_LIGHT,
            }
            fp = font_path_map.get(font_key, FONT_BODY)
            if not fp:
                continue

            font = _fit_text(draw, text, fp, max_width, font_size * 2, max_size=font_size)

            if align == "center":
                bbox = draw.textbbox((0, 0), text, font=font)
                tw = bbox[2] - bbox[0]
                x = (fmt.width - tw) // 2
            else:
                x = x_margin

            draw.text((x, current_y), text, fill=color, font=font)
            bbox = draw.textbbox((0, 0), text, font=font)
            th = bbox[3] - bbox[1]
            current_y += th + spacing

    def _template_luxury(self, fmt: BannerFormat, draw: ImageDraw) -> Image.Image:
        canvas = Image.new("RGBA", (fmt.width, fmt.height), (0, 0, 0, 255))
        draw = ImageDraw.Draw(canvas)
        self._apply_bg_gradient(draw, canvas.size, "dark")

        canvas = self._place_product_image(canvas, fmt)

        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        grad = []
        for i in range(canvas.height):
            t = i / canvas.height
            alpha = int(200 * (1 - t))
            grad.append((0, 0, 0, max(0, min(255, alpha))))
        _make_gradient(overlay_draw, canvas.size, grad, vertical=True)
        canvas = Image.alpha_composite(canvas, overlay)
        draw = ImageDraw.Draw(canvas)

        price_str = f"{self.product.price:,} {self.product.currency}"
        if self.product.discount:
            discounted = int(self.product.price * (1 - self.product.discount / 100))
            price_str = f"{discounted:,} {self.product.currency}"
            old_price = f"{self.product.price:,} {self.product.currency}"
            lines_text = [
                {"text": self.product.brand_name or DEFAULT_BRAND_NAME, "font": "heading", "size": 28, "color": PALETTE["gold"] + (255,)},
                {"text": self.product.name, "font": "heading", "size": 52, "color": (255, 255, 255, 255)},
                {"text": "", "spacing": 4},
                {"text": f"-{self.product.discount}%", "font": "bold", "size": 24, "color": PALETTE["gold_light"] + (255,)},
                {"text": f"{old_price}  →  {price_str}", "font": "bold", "size": 22, "color": (200, 200, 200, 255)},
                {"text": "", "spacing": 12},
                {"text": f"{self.product.category}", "font": "light", "size": 16, "color": PALETTE["gold"] + (200,)},
            ]
        else:
            lines_text = [
                {"text": self.product.brand_name or DEFAULT_BRAND_NAME, "font": "heading", "size": 28, "color": PALETTE["gold"] + (255,)},
                {"text": self.product.name, "font": "heading", "size": 48, "color": (255, 255, 255, 255)},
                {"text": "", "spacing": 8},
                {"text": f"{price_str}", "font": "bold", "size": 36, "color": PALETTE["gold_light"] + (255,)},
                {"text": "", "spacing": 12},
                {"text": f"{self.product.category}", "font": "light", "size": 16, "color": PALETTE["gold"] + (200,)},
            ]

        anchor_y = int(fmt.height * 0.08)
        self._add_text_overlay(draw, fmt, lines_text, anchor_y)

        if fmt.name == "hero":
            tagline = DEFAULT_TAGLINE
            tw, _ = draw.textbbox((0, 0), tagline, font=ImageFont.truetype(FONT_LIGHT, 14))[2:4] if FONT_LIGHT else (0, 0)
            draw.text((fmt.width - tw - int(fmt.width * 0.06), int(fmt.height * 0.06)),
                      tagline, fill=PALETTE["gold"] + (180,),
                      font=ImageFont.truetype(FONT_LIGHT, int(fmt.height * 0.025)) if FONT_LIGHT else None)

        return canvas

    def _template_modern(self, fmt: BannerFormat, draw: ImageDraw) -> Image.Image:
        canvas = Image.new("RGBA", (fmt.width, fmt.height), (0, 0, 0, 255))
        draw = ImageDraw.Draw(canvas)

        gold = PALETTE["gold"]
        dark = PALETTE["dark"]

        draw.rectangle([(0, 0), (fmt.width, fmt.height)], fill=dark + (255,))

        accent_h = int(fmt.height * 0.04)
        draw.rectangle([(0, 0), (fmt.width, accent_h)], fill=gold + (255,))
        draw.rectangle([(0, fmt.height - accent_h), (fmt.width, fmt.height)], fill=gold + (255,))

        canvas = self._place_product_image(canvas, fmt)

        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        grad = []
        for i in range(canvas.height):
            t = i / canvas.height
            alpha = int(150 * (1 - t))
            grad.append((0, 0, 0, max(0, min(255, alpha))))
        _make_gradient(overlay_draw, canvas.size, grad, vertical=True)
        canvas = Image.alpha_composite(canvas, overlay)
        draw = ImageDraw.Draw(canvas)

        price_str = f"{self.product.price:,} {self.product.currency}"
        if self.product.discount:
            discounted = int(self.product.price * (1 - self.product.discount / 100))
            price_str = f"{discounted:,} {self.product.currency}"

        lines_text = [
            {"text": self.product.category.upper(), "font": "light", "size": 18, "color": gold + (220,)},
            {"text": self.product.name, "font": "heading", "size": 44, "color": (255, 255, 255, 255)},
            {"text": "", "spacing": 4},
            {"text": price_str, "font": "bold", "size": 32, "color": gold + (255,)},
        ]
        if self.product.discount:
            old_price = f"{self.product.price:,} {self.product.currency}"
            lines_text.insert(
                3,
                {"text": f"-{self.product.discount}%  au lieu de {old_price}", "font": "body", "size": 18, "color": (200, 150, 150, 255)},
            )

        desc_w = int(fmt.width * 0.45)
        anchor_y = int(fmt.height * 0.12)
        self._add_text_overlay(draw, fmt, lines_text, anchor_y, x_margin=int(fmt.width * 0.06))

        return canvas

    def _template_minimal(self, fmt: BannerFormat, draw: ImageDraw) -> Image.Image:
        canvas = Image.new("RGBA", (fmt.width, fmt.height), (255, 255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        img_path = self._product_image_path()
        product_img = _load_image(img_path)
        if product_img:
            if fmt.width > fmt.height:
                img_h = fmt.height
                ratio = img_h / product_img.height
                img_w = int(product_img.width * ratio)
                product_img = product_img.resize((img_w, img_h), Image.LANCZOS)
                x = fmt.width - img_w
                canvas.paste(product_img, (x, 0))
            else:
                img_w = fmt.width
                ratio = img_w / product_img.width
                img_h = int(product_img.height * ratio)
                product_img = product_img.resize((img_w, img_h), Image.LANCZOS)
                canvas.paste(product_img, (0, 0))

        overlay = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        grad = []
        for i in range(canvas.width):
            t = i / canvas.width
            alpha = int(220 * (1 - t))
            grad.append((255, 255, 255, max(0, min(255, alpha))))
        _make_gradient(overlay_draw, canvas.size, grad, vertical=False)
        canvas = Image.alpha_composite(canvas, overlay)
        draw = ImageDraw.Draw(canvas)

        price_str = f"{self.product.price:,} {self.product.currency}"
        lines_text = [
            {"text": self.product.name, "font": "heading", "size": 40, "color": (30, 30, 30, 255)},
            {"text": "", "spacing": 4},
            {"text": price_str, "font": "bold", "size": 30, "color": PALETTE["gold_dark"] + (255,)},
            {"text": "", "spacing": 8},
            {"text": self.product.description[:80] + ("..." if len(self.product.description) > 80 else ""),
             "font": "body", "size": 18, "color": (80, 80, 80, 200)},
        ]

        anchor_y = int(fmt.height * 0.15)
        self._add_text_overlay(draw, fmt, lines_text, anchor_y, x_margin=int(fmt.width * 0.06))

        return canvas

    def _template_sale(self, fmt: BannerFormat, draw: ImageDraw) -> Image.Image:
        canvas = Image.new("RGBA", (fmt.width, fmt.height), (0, 0, 0, 255))
        draw = ImageDraw.Draw(canvas)
        self._apply_bg_gradient(draw, canvas.size, "gold")

        canvas = self._place_product_image(canvas, fmt)

        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([(0, 0), (fmt.width, fmt.height)], fill=(0, 0, 0, 120))
        canvas = Image.alpha_composite(canvas, overlay)
        draw = ImageDraw.Draw(canvas)

        if not self.product.discount:
            self.product.discount = 15

        price_str = f"{self.product.price:,} {self.product.currency}"
        discounted = int(self.product.price * (1 - self.product.discount / 100))
        sale_price_str = f"{discounted:,} {self.product.currency}"

        lines_text = [
            {"text": "SALE", "font": "heading", "size": 48, "color": PALETTE["gold"] + (255,)},
            {"text": f"-{self.product.discount}%", "font": "heading", "size": 72, "color": (255, 60, 60, 255)},
            {"text": self.product.name, "font": "bold", "size": 28, "color": (255, 255, 255, 255)},
            {"text": "", "spacing": 4},
            {"text": f"{sale_price_str}", "font": "bold", "size": 36, "color": PALETTE["gold_light"] + (255,)},
            {"text": f"au lieu de {price_str}", "font": "body", "size": 18, "color": (200, 200, 200, 200)},
        ]

        anchor_y = int(fmt.height * 0.06)
        self._add_text_overlay(draw, fmt, lines_text, anchor_y)

        return canvas

    def _template_social(self, fmt: BannerFormat, draw: ImageDraw) -> Image.Image:
        canvas = Image.new("RGBA", (fmt.width, fmt.height), (0, 0, 0, 255))
        draw = ImageDraw.Draw(canvas)
        self._apply_bg_gradient(draw, canvas.size, "navy")

        canvas = self._place_product_image(canvas, fmt)

        silver_line_y = int(fmt.height * 0.55)
        draw.line([(int(fmt.width * 0.08), silver_line_y), (int(fmt.width * 0.5), silver_line_y)],
                  fill=PALETTE["gold"] + (150,), width=2)

        price_str = f"{self.product.price:,} {self.product.currency}"
        lines_text = [
            {"text": self.product.name.upper(), "font": "heading", "size": 36, "color": (255, 255, 255, 255)},
            {"text": "", "spacing": 4},
            {"text": price_str, "font": "bold", "size": 28, "color": PALETTE["gold"] + (255,)},
            {"text": "", "spacing": 8},
            {"text": DEFAULT_TAGLINE, "font": "light", "size": 16, "color": PALETTE["gold"] + (180,)},
        ]

        anchor_y = silver_line_y + 20
        self._add_text_overlay(draw, fmt, lines_text, anchor_y)

        return canvas

    def save(self, fmt: BannerFormat, template: TemplateName = "luxury", output_dir: Optional[str] = None) -> str:
        if output_dir is None:
            output_dir = OUTPUT_DIR

        subdir = os.path.join(output_dir, template, fmt.name)
        os.makedirs(subdir, exist_ok=True)

        img = self.generate(fmt, template)
        if img is None:
            raise RuntimeError(f"Failed to generate ad for {self.product.name} / {fmt.name}")

        safe_name = self.product.name.replace(" ", "_").replace("/", "_").lower()[:40]
        filename = f"{self.product.id}_{safe_name}_{fmt.name}.png"
        filepath = os.path.join(subdir, filename)
        img.convert("RGB").save(filepath, "PNG")
        return filepath


def generate_all_templates(
    product: ProductData,
    formats: Optional[list[BannerFormat]] = None,
    templates: Optional[list[TemplateName]] = None,
    output_dir: Optional[str] = None,
) -> list[str]:
    if formats is None:
        formats = BANNER_FORMATS
    if templates is None:
        templates = ["luxury"]

    generator = AdGenerator(product)
    paths = []
    for fmt in formats:
        for template in templates:
            path = generator.save(fmt, template, output_dir)
            paths.append(path)
    return paths
