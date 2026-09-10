# Ball Lightning discharge review

Before-edit source: c978ed1053da19aae128fefb6d5c2946c5af2510.

Native decoded frame 111 of the previous six-second clip shows a pale, hairline violet web around the two stalkers. Actors remain readable, but no dominant trunk carries the discharge. The regular zigzags resemble fine wire more than a forceful lightning strike. The event starts at frame 110, leaving almost no aftermath.

Source limitations in AttackEffects.ts: six endpoints have identical radius and exact 60-degree spacing; all trunks use the same .012 core and .045 corona radius, all branches the same .55 multiplier. electricArc.ts alternates displacement sign at twelve evenly spaced points and forks at fixed indices 3, 6, 9. Restrikes change the seed every .045 seconds but preserve that rhythm. Lifetime is .26 seconds. Increasing bloom would hide actors without fixing this geometry.

Scoped treatment: separate Ball Lightning geometry from unchanged targeted arcs. Use uneven endpoint angles and reach, nonuniform longitudinal steps, random signed kinks, forks from real trunk vertices, and segment-varying tapered widths. Increase the white-blue trunk weight, keep the violet envelope narrow and translucent, and retain the existing fixed beam budget. Preserve real charge, damage, radius and all gameplay code. Record after bounded real-hit preroll through the charge precursor so the discharge lands early with a full aftermath.
