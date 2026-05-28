import json
import re

txt_path = r"c:\Users\EDC\Desktop\CapelliSucursalVirtual\catalogo\LISTADO_PRECIOS_EXTRACTED.txt"

with open(txt_path, "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f]

products = []
errors = []

i = 0
n = len(lines)

# Set of headers to skip
headers = {"PR", "CODIGO", "DESCRIPCION", "CONTEN.", "PREC.PUB. PREC.PROF.", "20/5/2026", "20/05/2026"}

brand_codes = set()

current_page = None

while i < n:
    line = lines[i]
    
    if not line:
        i += 1
        continue
        
    if line.startswith("--- PAGE"):
        current_page = line
        i += 1
        continue
        
    if line in headers or "PAGE" in line or line.startswith("20/5/") or line.startswith("20/05/"):
        i += 1
        continue
        
    # Check if this line looks like a brand code (often 2-3 characters uppercase, e.g. "OW", "WE", "KP", "OP", "SO", etc.)
    # Let's see if we can match a block:
    # We expect a brand code, then code, then description, then content, then public price, then professional price.
    # Let's inspect the next few lines:
    if i + 5 < n:
        brand = lines[i]
        code = lines[i+1]
        desc = lines[i+2]
        content = lines[i+3]
        pub_price_str = lines[i+4]
        prof_price_str = lines[i+5]
        
        # Validate that pub_price_str and prof_price_str look like prices (contain $)
        if "$" in pub_price_str and "$" in prof_price_str:
            # Clean up prices
            try:
                pub_price = float(pub_price_str.replace("$", "").replace(",", "").strip())
                prof_price = float(prof_price_str.replace("$", "").replace(",", "").strip())
            except ValueError:
                pub_price = 0.0
                prof_price = 0.0
            
            products.append({
                "brand": brand,
                "code": code,
                "description": desc,
                "content": content,
                "public_price": pub_price,
                "professional_price": prof_price,
                "page": current_page
            })
            brand_codes.add(brand)
            i += 6
            continue
            
    # If we didn't match, we advance by 1 and log it if it's not empty and not headers
    if line and line not in headers and not line.startswith("---"):
        errors.append((current_page, i, lines[i:i+6]))
    i += 1

print(f"Parsed {len(products)} products.")
print(f"Unique brand codes ({len(brand_codes)}):", sorted(list(brand_codes)))
print(f"Number of unparsed/error lines/blocks: {len(errors)}")
if errors:
    print("Sample errors:")
    for err in errors[:10]:
        print(err)

# Let's group products by brand and see the counts
brand_counts = {}
for p in products:
    brand = p["brand"]
    brand_counts[brand] = brand_counts.get(brand, 0) + 1

print("Brand counts:")
for b, count in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {b}: {count}")

# Save all products to products.json
with open(r"c:\Users\EDC\Desktop\CapelliSucursalVirtual\catalogo\products.json", "w", encoding="utf-8") as out:
    json.dump(products, out, ensure_ascii=False, indent=2)

print("Saved to products.json")
