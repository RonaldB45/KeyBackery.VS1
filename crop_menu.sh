#!/bin/bash
IMG="/app/applet/public/assets/aistudio/0ba41b17-1c43-42d2-ad7f-f73f849eccb1_002f2b20.jpeg"
OUT="/app/applet/public/assets/images/menu"
mkdir -p "$OUT"

# Row 1 (y=305, h=170)
convert "$IMG" -crop 216x170+29+305 +repage "$OUT/brownies.jpg"
convert "$IMG" -crop 216x170+273+305 +repage "$OUT/pastisetas.jpg"
convert "$IMG" -crop 216x170+517+305 +repage "$OUT/alfajores.jpg"
convert "$IMG" -crop 216x170+761+305 +repage "$OUT/tres_leches_tradicional.jpg"

# Row 2 (y=600, h=170)
convert "$IMG" -crop 216x170+29+600 +repage "$OUT/tres_leches_coco.jpg"
convert "$IMG" -crop 216x170+273+600 +repage "$OUT/tres_leches_chocolate.jpg"
convert "$IMG" -crop 216x170+517+600 +repage "$OUT/flan.jpg"
convert "$IMG" -crop 216x170+761+600 +repage "$OUT/carrot_cake.jpg"

# Row 3 (y=895, h=170)
convert "$IMG" -crop 216x170+29+895 +repage "$OUT/bizcocho_vainilla.jpg"
convert "$IMG" -crop 216x170+273+895 +repage "$OUT/bizcocho_milky_way.jpg"
convert "$IMG" -crop 216x170+517+895 +repage "$OUT/bizcocho_chocomatilda.jpg"
convert "$IMG" -crop 216x170+761+895 +repage "$OUT/volteado_pina.jpg"

# Entre otros (circular highlights)
convert "$IMG" -crop 155x155+446+1208 +repage "$OUT/minicakes_cupcakes.jpg"
convert "$IMG" -crop 155x155+620+1208 +repage "$OUT/cupcakes_variados.jpg"
convert "$IMG" -crop 155x155+798+1208 +repage "$OUT/galletas_pastisetas.jpg"

rm -f "$OUT/test_crop1.jpg" "$OUT/test_trim.jpg"
echo "All 12 menu items and extras cropped perfectly!"
