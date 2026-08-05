import json
import os
import sys
from typing import Optional

from config import ProductData, OUTPUT_DIR, BANNER_FORMATS
from generator import AdGenerator, generate_all_templates, TemplateName


def load_products(json_path: str) -> list[ProductData]:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [ProductData(**item) for item in data]


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Générateur automatique de publicités LDBusiness"
    )
    parser.add_argument(
        "--products",
        default=os.path.join(os.path.dirname(__file__), "products.json"),
        help="Chemin vers le fichier JSON des produits",
    )
    parser.add_argument(
        "--format",
        nargs="*",
        choices=[f.name for f in BANNER_FORMATS] + ["all"],
        default=["all"],
        help="Formats de bannières à générer (défaut: all)",
    )
    parser.add_argument(
        "--template",
        nargs="*",
        choices=["luxury", "modern", "minimal", "sale", "social", "all"],
        default=["all"],
        help="Template de design (défaut: all)",
    )
    parser.add_argument(
        "--output",
        default=OUTPUT_DIR,
        help="Répertoire de sortie",
    )
    parser.add_argument(
        "--product-id",
        type=int,
        default=None,
        help="Générer seulement pour un produit spécifique par ID",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Afficher les produits disponibles et formats",
    )

    args = parser.parse_args()

    products = load_products(args.products)

    if args.list:
        print("=== PRODUITS DISPONIBLES ===")
        for p in products:
            print(f"  [{p.id}] {p.name} — {p.price} {p.currency} ({p.category})")
        print()
        print("=== FORMATS DISPONIBLES ===")
        for f in BANNER_FORMATS:
            print(f"  {f.name:20s} {f.width}x{f.height} — {f.label}")
        print()
        print("=== TEMPLATES DISPONIBLES ===")
        for t in ["luxury", "modern", "minimal", "sale", "social"]:
            print(f"  {t}")
        return

    formats = BANNER_FORMATS
    if "all" not in (args.format or []):
        formats = [f for f in BANNER_FORMATS if f.name in args.format]

    templates: list[TemplateName] = ["luxury"]
    if "all" not in (args.template or []):
        templates = [t for t in args.template if t in ("luxury", "modern", "minimal", "sale", "social")]
    elif "all" in (args.template or []):
        templates = ["luxury", "modern", "minimal", "sale", "social"]

    if args.product_id:
        products = [p for p in products if p.id == args.product_id]

    total = 0
    for product in products:
        print(f"\n[{product.id}] {product.name}")
        paths = generate_all_templates(
            product,
            formats=formats,
            templates=templates,
            output_dir=args.output,
        )
        for path in paths:
            rel = os.path.relpath(path, args.output)
            print(f"  [OK] {rel}")
            total += 1

    print(f"\n=== {total} publicités générées dans {args.output} ===")


if __name__ == "__main__":
    main()
