import os
from dataclasses import dataclass, field
from typing import Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
PUBLIC_IMAGES_DIR = os.path.join(PROJECT_DIR, "public", "images")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

FONTS_DIR = os.path.join(BASE_DIR, "fonts")
WINDOWS_FONTS_DIR = "C:\\Windows\\Fonts"


def font_path(name):
    path = os.path.join(FONTS_DIR, name)
    if os.path.exists(path):
        return path
    path = os.path.join(WINDOWS_FONTS_DIR, name)
    if os.path.exists(path):
        return path
    return None


FONT_HEADING = font_path("Cinzel-Black.ttf") or font_path("arialbd.ttf")
FONT_BODY = font_path("Roboto-Regular.ttf") or font_path("arial.ttf")
FONT_BOLD = font_path("Roboto-Bold.ttf") or font_path("arialbd.ttf")
FONT_LIGHT = font_path("Roboto-Light.ttf") or font_path("ariali.ttf")


PALETTE = {
    "gold": (212, 175, 55),
    "gold_light": (230, 200, 90),
    "gold_dark": (170, 140, 40),
    "black": (10, 10, 10),
    "dark": (18, 18, 24),
    "white": (255, 255, 255),
    "cream": (245, 240, 230),
    "burgundy": (128, 0, 32),
    "emerald": (0, 128, 96),
    "navy": (20, 30, 60),
    "overlay": (0, 0, 0, 180),
    "overlay_light": (0, 0, 0, 100),
}


@dataclass
class BannerFormat:
    name: str
    width: int
    height: int
    label: str


BANNER_FORMATS = [
    BannerFormat("hero", 1400, 600, "Hero Banner (21:9)"),
    BannerFormat("popup", 600, 800, "Popup (4:3)"),
    BannerFormat("sidebar", 400, 600, "Sidebar (2:3)"),
    BannerFormat("carousel", 1200, 400, "Carousel (3:1)"),
    BannerFormat("square", 1080, 1080, "Square 1:1 (Instagram/Facebook)"),
    BannerFormat("story", 1080, 1920, "Story 9:16 (Instagram/TikTok)"),
    BannerFormat("landscape", 1200, 630, "Landscape (Facebook Link)"),
]


@dataclass
class ProductData:
    id: int
    name: str
    description: str
    price: int
    currency: str
    image: str
    category: str
    discount: Optional[int] = None
    store_name: str = "LDBusiness"
    brand_name: str = ""


DEFAULT_BRAND_NAME = "LDBusiness"
DEFAULT_TAGLINE = "L'Élégance Africaine"

os.makedirs(OUTPUT_DIR, exist_ok=True)
