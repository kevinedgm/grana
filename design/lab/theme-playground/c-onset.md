# C · ¿desde qué superficie empieza a sobrecorregir?

Barrido de `surface` L 0.10 a 0.32 (paso 0.01), con el mismo tono y croma que la superficie real de cada tema. Solo medición (`scripts/c-onset.mjs`); **no** define ningún límite.

Cada celda es la **primera superficie L** en la que ocurre el hecho (— = nunca en el rango). «Nuevo» excluye los roles que ya eran muy claros con la superficie más baja (el neón y la menta de Spotify, el naranja de Amazon, el gris de Medium).

| Tema | Superficie real | L media de C > 0.74 | Algún rol nuevo con L > 0.74 | Algún rol con croma < 0.75 | 2+ roles con croma < 0.75 | C eleva > 0.08 sobre A |
| --- | --- | --- | --- | --- | --- | --- |
| notion | 0.226 | 0.26 | 0.24 | 0.26 | 0.28 | 0.17 |
| apple | 0.226 | 0.26 | 0.25 | 0.22 | 0.26 | 0.17 |
| medium | 0.226 | 0.26 | 0.25 | 0.26 | 0.29 | 0.17 |
| stripe | 0.228 | 0.26 | 0.26 | 0.20 | 0.26 | 0.17 |
| caracol-purpura | 0.226 | 0.26 | 0.25 | 0.26 | 0.29 | 0.17 |
| amazon | 0.226 | 0.25 | 0.25 | 0.26 | 0.29 | 0.17 |
| github | 0.226 | 0.26 | 0.24 | 0.25 | 0.26 | 0.17 |
| spotify | 0.225 | 0.22 | 0.25 | 0.26 | 0.29 | 0.17 |
| linear | 0.228 | 0.26 | 0.26 | 0.26 | 0.26 | 0.17 |
| grana | 0.226 | 0.26 | 0.25 | 0.26 | 0.29 | 0.17 |
| lustre | 0.227 | 0.25 | 0.26 | 0.23 | 0.26 | 0.17 |

## Resumen

- **L media de C > 0.74:** superficie 0.22 a 0.26 (mediana 0.26, 11/11 temas)
- **algún rol nuevo con L > 0.74:** superficie 0.24 a 0.26 (mediana 0.25, 11/11 temas)
- **algún rol con croma < 0.75:** superficie 0.20 a 0.26 (mediana 0.26, 11/11 temas)
- **2+ roles con croma < 0.75:** superficie 0.26 a 0.29 (mediana 0.28, 11/11 temas)
- **C eleva > 0.08 sobre A:** superficie 0.17 a 0.17 (mediana 0.17, 11/11 temas)

## Evolución de C con la superficie (media de los 6 roles)

| Tema | L 0.10 | L 0.15 | L 0.20 | L 0.25 | L 0.30 |
| --- | --- | --- | --- | --- | --- |
| notion | 0.603 (0 pastel) | 0.635 (0 pastel) | 0.682 (0 pastel) | 0.737 (0 pastel) | 0.792 (3 pastel) |
| apple | 0.617 (0 pastel) | 0.647 (0 pastel) | 0.692 (0 pastel) | 0.739 (1 pastel) | 0.793 (3 pastel) |
| medium | 0.606 (0 pastel) | 0.645 (0 pastel) | 0.688 (0 pastel) | 0.737 (0 pastel) | 0.789 (2 pastel) |
| stripe | 0.605 (0 pastel) | 0.636 (0 pastel) | 0.682 (1 pastel) | 0.733 (1 pastel) | 0.788 (3 pastel) |
| caracol-purpura | 0.593 (0 pastel) | 0.630 (0 pastel) | 0.683 (0 pastel) | 0.736 (0 pastel) | 0.789 (2 pastel) |
| amazon | 0.637 (0 pastel) | 0.663 (0 pastel) | 0.697 (0 pastel) | 0.743 (0 pastel) | 0.789 (2 pastel) |
| github | 0.604 (0 pastel) | 0.641 (0 pastel) | 0.684 (0 pastel) | 0.738 (1 pastel) | 0.793 (3 pastel) |
| spotify | 0.671 (0 pastel) | 0.698 (0 pastel) | 0.731 (0 pastel) | 0.767 (0 pastel) | 0.805 (2 pastel) |
| linear | 0.599 (0 pastel) | 0.635 (0 pastel) | 0.680 (0 pastel) | 0.732 (0 pastel) | 0.788 (4 pastel) |
| grana | 0.592 (0 pastel) | 0.629 (0 pastel) | 0.679 (0 pastel) | 0.733 (0 pastel) | 0.789 (3 pastel) |
| lustre | 0.627 (0 pastel) | 0.657 (0 pastel) | 0.701 (0 pastel) | 0.745 (1 pastel) | 0.796 (3 pastel) |
