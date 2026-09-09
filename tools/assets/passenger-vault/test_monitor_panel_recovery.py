"""Imported closed panels must reach a real supported inward sliding state.

Run with Blender --background --factory-startup --python-exit-code 1.
No author(), export, render, object deletion or hidden-object filtering.
Bounds use every transformed imported vertex. Segment swept AABBs are exact
for these axis translations of boxes, conservative for other mesh shapes.
The proposed supported path is 110mm east, then 900mm toward the other bay.
Both panels are checked separately; the opposite panel stays closed.
"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import monitoring as m

EPS = 1e-5
CLEARANCE = .005
RESERVATION = [[-1.875, -1.25, 0], [1.875, 1.25, 1.25]]


def shift(b, d):
    return [[b[k][a] + d[a] for a in range(3)] for k in range(2)]


def sweep(b, start, end):
    return [[b[0][a] + min(start[a], end[a]) for a in range(3)],
            [b[1][a] + max(start[a], end[a]) for a in range(3)]]


def overlap(a, b):
    return [min(a[1][k], b[1][k]) - max(a[0][k], b[0][k]) for k in range(3)]


def blocked(a, b):
    # At least 5mm separation on one axis, not merely no triangle crossings.
    return all(v > -CLEARANCE + EPS for v in overlap(a, b))


def positions(i):
    return [(0, 0, 0), (.11, 0, 0), (.11, .90 if i == 0 else -.90, 0)]


def expected_closure(top):
    return {
        'service_mullion': [[-1.85, -.04, .21], [-1.81, .04, top]],
        'service_sill': [[-1.85, -1.17, .12], [-1.81, 1.17, .20]],
        'support_shelf': [[-1.84, -1.17, .20], [-1.69, 1.17, .21]],
        **{f'service_panel_{i}': [[-1.85, y-.555, .21], [-1.81, y+.555, top-.01]]
           for i, y in enumerate([-.605, .605])},
    }


def contact(a, b, axis):
    ov = overlap(a, b)
    return abs(ov[axis]) <= EPS and all(ov[j] > EPS for j in range(3) if j != axis)


def check_closure(bounds):
    # Exact rectangular extents enforce coverage and the specified reveals.
    # This is an envelope contract, not a replacement for post-author mesh rays.
    failures = []
    top = bounds['service_worktop'][0][2]
    for name, expected in expected_closure(top).items():
        if name not in bounds:
            failures.append(dict(segment='closure', obstacle=name, reason='missing'))
        elif any(abs(bounds[name][k][a]-expected[k][a]) > EPS for k in range(2) for a in range(3)):
            failures.append(dict(segment='closure', obstacle=name, reason='coverage_or_reveal'))
    pairs = [('service_sill', 'deck_plinth', 2),
             ('service_sill', 'side_north', 1), ('service_sill', 'side_south', 1),
             ('support_shelf', 'service_sill', 2),
             ('support_shelf', 'electronics_tray_0', 2),
             ('support_shelf', 'electronics_tray_1', 2),
             ('support_shelf', 'side_north', 1),
             ('support_shelf', 'side_south', 1),
             ('service_mullion', 'support_shelf', 2),
             ('service_mullion', 'service_worktop', 2)]
    for a, b, axis in pairs:
        if a not in bounds or b not in bounds or not contact(bounds[a], bounds[b], axis):
            failures.append(dict(segment='contact', obstacle=a, target=b, reason='missing_contact'))
    # Only these explicitly checked bearing/butt interfaces may touch.
    allowed = {frozenset((a, b)) for a, b, _ in pairs}
    allowed.update(frozenset(('support_shelf', f'service_panel_{i}')) for i in range(2))

    for name in ['service_mullion', 'service_sill', 'support_shelf']:
        if name not in bounds:
            continue
        for other, b in bounds.items():
            if other != name and frozenset((name, other)) not in allowed and blocked(bounds[name], b):
                failures.append(dict(segment='closure_collision', obstacle=name, target=other))
    return failures


def check_closed(bounds, i):
    panel = bounds[f'service_panel_{i}']
    failures = check_closure(bounds)
    for key in ['central_bulkhead', 'side_north', 'side_south']:
        ov = overlap(panel, bounds[key])
        if blocked(panel, bounds[key]):
            failures.append(dict(obstacle=key, overlap_m=ov))
    return failures


def service_tunnel(bounds, i):
    pack = bounds[f'electronics_pack_{i}']
    y = sum(pack[k][1] for k in range(2))/2
    z = sum(pack[k][2] for k in range(2))/2
    return [[-2.175, y-.05, z-.05], [pack[0][0], y+.05, z+.05]]


def check_handling(bounds, i):
    failures = []
    panel = bounds[f'service_panel_{i}']
    latch = bounds[f'latch_{i}']
    y = sum(latch[k][1] for k in range(2))/2
    z = sum(latch[k][2] for k in range(2))/2
    # One continuous 50x100x100mm grip, plus a 300mm straight approach.
    # It touches only the latch's west face. No handoff or hidden hand.
    hand = [[latch[0][0]-.05, y-.05, z-.05], [latch[0][0], y+.05, z+.05]]
    approach = [[-2.175, y-.05, z-.05], hand[1][:]]
    moving = {f'{p}_{i}' for p in ['service_panel', 'latch', 'panel_seam']}
    if not contact(latch, hand, 0) or not all(v > -EPS for v in overlap(latch, panel)):
        failures.append(dict(segment='handling', obstacle=f'latch_{i}', reason='unattached_grip'))
    for segment, (start, end) in enumerate(zip(positions(i), positions(i)[1:])):
        # Both travel directions have this same occupied union.
        for kind, proxy in [('grip', hand), ('approach', approach)]:
            swept = sweep(proxy, start, end)
            for key, b in bounds.items():
                if key in moving:
                    # Co-moving latch contact alone is allowed; the hand/arm
                    # still must clear the panel and seam in relative space.
                    if key != f'latch_{i}' and blocked(proxy, b):
                        failures.append(dict(segment='handling', leg=segment, occupancy=kind, obstacle=key))
                elif blocked(swept, b):
                    failures.append(dict(segment='handling', leg=segment, occupancy=kind, obstacle=key))
        if 'support_shelf' not in bounds:
            failures.append(dict(segment='support', leg=segment, obstacle='support_shelf', reason='missing'))
            continue
        shelf = bounds['support_shelf']
        # Constant-z translations on a rectangular shelf: endpoint minimum
        # bearing widths bound every intermediate point, with no sampling.
        for pose in [start, end]:
            actual = shift(panel, pose)
            ov = overlap(actual, shelf)
            if not contact(actual, shelf, 2) or ov[0] < .03-EPS or ov[1] < actual[1][1]-actual[0][1]-EPS:
                failures.append(dict(segment='support', leg=segment, obstacle='support_shelf', reason='lost_bearing'))
    if blocked(shift(approach, positions(i)[-1]), service_tunnel(bounds, i)):
        failures.append(dict(segment='handling', obstacle='service_tunnel', reason='holding_service_conflict'))
    return failures


def check_path(bounds, i, cap, handling=True):
    moving = {f'{p}_{i}' for p in ['service_panel', 'latch', 'panel_seam']}
    poses = positions(i)
    failures = check_handling(bounds, i) if handling else []
    limit = [RESERVATION[0], [1.875, 1.25, cap]]
    for segment, (start, end) in enumerate(zip(poses, poses[1:])):
        for key in sorted(moving):
            swept = sweep(bounds[key], start, end)
            if any(swept[0][a] < limit[0][a]-EPS or swept[1][a] > limit[1][a]+EPS for a in range(3)):
                failures.append(dict(segment=segment, moving=key, obstacle='reservation', swept_m=swept))
            for fixed, b in bounds.items():
                if fixed in moving:
                    continue  # These three parts move together, never disappear.
                if fixed == 'support_shelf' and key == f'service_panel_{i}' and contact(swept, b, 2):
                    continue  # Bearing is independently required by check_handling.
                if blocked(swept, b):
                    failures.append(dict(segment=segment, moving=key, obstacle=fixed,
                                         overlap_m=overlap(swept, b)))
    # A finite 100mm square working tunnel to the pack west face. Include ALL
    # closed geometry and all moving geometry at its reached position.
    tunnel = service_tunnel(bounds, i)
    for key, b in bounds.items():
        if key == f'electronics_pack_{i}':
            continue  # Intended target terminates the tunnel.
        actual = shift(b, poses[-1]) if key in moving else b
        if blocked(tunnel, actual):
            failures.append(dict(segment='access', obstacle=key, overlap_m=overlap(tunnel, actual)))
    return failures


def proposal_envelopes(bounds, cap):
    """Dimension-only feasibility model, NOT repaired/imported GLB evidence."""
    import copy
    b = copy.deepcopy(bounds)
    top = cap-.32
    b['central_bulkhead'][0][0] = -1.67
    b.update(expected_closure(top))
    for i, y in enumerate([-.605, .605]):
        b[f'service_panel_{i}'] = [[-1.85, y-.555, .21], [-1.81, y+.555, top-.01]]
        b[f'panel_seam_{i}'] = [[-1.861, y-.539, .23], [-1.849, y-.521, top-.03]]
        grip_y = -1.06 if i == 0 else 1.06
        b[f'latch_{i}'] = [[-1.875, grip_y-.04, top-.1875], [-1.849, grip_y+.04, top-.1325]]
    return b


def feasibility():
    """Measure proposed boxes against unchanged imported obstacle bounds."""
    root = Path(__file__).resolve().parents[3]
    for variant, cap in m.HEIGHTS.items():
        m.reset()
        parts = m.load(root / f'public/assets/passenger-vault/monitor-{variant}.glb')
        b = proposal_envelopes({o.name: m.bounds([o]) for o in parts}, cap)
        for i in range(2):
            assert not check_closed(b, i), check_closed(b, i)
            assert not check_path(b, i, cap), check_path(b, i, cap)
            import copy
            controls = []
            def reject(label, altered, predicate, checker=None):
                result = (checker or (lambda bb: check_path(bb, i, cap)))(altered)
                assert any(predicate(f) for f in result), (label, result)
                controls.append(label)
            blocked_b = copy.deepcopy(b)
            mid_y = -.61 if i == 0 else .61
            top = cap-.32
            blocker = [[-1.76, mid_y-.01, top-.17], [-1.755, mid_y+.01, top-.15]]
            blocked_b['test_mid_sweep_blocker'] = blocker
            for pose in positions(i):
                for part in ['service_panel', 'latch', 'panel_seam']:
                    assert not blocked(shift(b[f'{part}_{i}'], pose), blocker), 'blocker hits a waypoint'
            reject('intermediate_latch_sweep', blocked_b,
                   lambda f: f.get('segment') == 1 and f.get('moving') == f'latch_{i}' and f['obstacle'] == 'test_mid_sweep_blocker')
            blocked_b = copy.deepcopy(b)
            y = -.605 if i == 0 else .605
            blocked_b['test_access_blocker'] = [[-1.69, y-.08, .25], [-1.67, y+.08, .45]]
            reject('final_access', blocked_b, lambda f: f['segment'] == 'access' and f['obstacle'] == 'test_access_blocker')
            blocked_b = copy.deepcopy(b)
            blocked_b[f'latch_{i}'][0][0] = -1.90
            reject('reservation', blocked_b, lambda f: f['obstacle'] == 'reservation')
            for name in expected_closure(top):
                for fault in ['missing', 'displaced']:
                    altered = copy.deepcopy(b)
                    if fault == 'missing':
                        del altered[name]
                    else:
                        altered[name] = shift(altered[name], (0, 0, .02))
                    reject(f'{name}_{fault}', altered,
                           lambda f, n=name: f['segment'] == 'closure' and f['obstacle'] == n,
                           check_closure)
            for name in ['service_sill', 'service_mullion', 'support_shelf']:
                altered = copy.deepcopy(b)
                altered[name] = shift(altered[name], (0, 0, .02))
                reject(f'{name}_contact', altered,
                       lambda f, n=name: f['segment'] == 'contact' and f['obstacle'] == n,
                       check_closure)
            altered = copy.deepcopy(b)
            del altered['support_shelf']
            assert not check_path(altered, i, cap, handling=False), 'bare path must remain clear'
            reject('support_removed_bare_path_clear', altered,
                   lambda f: f['segment'] == 'support' and f['obstacle'] == 'support_shelf')
            altered = copy.deepcopy(b)
            gy = -1.06 if i == 0 else 1.06
            altered['test_grip_blocker'] = [[-2.05, gy-.02, top-.18], [-2.0, gy+.02, top-.14]]
            assert not check_path(altered, i, cap, handling=False), 'bare path must remain clear'
            reject('grip_blocked_bare_path_clear', altered,
                   lambda f: f['segment'] == 'handling' and f['obstacle'] == 'test_grip_blocker')
            # Recreate the review's central-grip error. Hardware still clears.
            altered = copy.deepcopy(b)
            altered[f'latch_{i}'] = shift(altered[f'latch_{i}'], (0, .455 if i == 0 else -.455, 0))
            assert not check_path(altered, i, cap, handling=False)
            reject('central_grip_hidden', altered,
                   lambda f: f['segment'] == 'handling' and f['obstacle'] in ['service_mullion', f'service_panel_{1-i}'])
            print('PROPOSAL_CONTROLS ' + json.dumps(dict(variant=variant, panel=i, count=len(controls), rejected=controls)), flush=True)
        print('PROPOSAL_ENVELOPE_ONLY ' + json.dumps(dict(variant=variant, bounds=b, gates='clear including continuous grip, bearing and concurrent service; not asset acceptance')), flush=True)


def main():
    root = Path(__file__).resolve().parents[3]
    failures = []
    for variant, cap in m.HEIGHTS.items():
        path = root / f'public/assets/passenger-vault/monitor-{variant}.glb'
        m.reset()
        parts = m.load(path)
        from monitor_panel_mesh_contract import check as mesh_check
        mesh_check(parts, variant)
        bounds = {o.name: m.bounds([o]) for o in parts}
        print('IMPORTED ' + json.dumps(dict(variant=variant, sha256=hashlib.sha256(path.read_bytes()).hexdigest(), bounds=bounds)), flush=True)
        for i in range(2):
            for gate, result in [('closed_partition_clearance', check_closed(bounds, i)),
                                 ('continuous_sweep_and_reached_access', check_path(bounds, i, cap))]:
                row = dict(variant=variant, panel=i, gate=gate, failures=result)
                print('PANEL_GATE ' + json.dumps(row), flush=True)
                if result:
                    failures.append(row)
    print('PANEL_RECOVERY_RESULT ' + json.dumps(dict(failed_gates=len(failures), expected_gates=8)), flush=True)
    assert not failures, f'{len(failures)}/8 imported panel gates failed; see PANEL_GATE records'


if __name__ == '__main__':
    if '--proposal-envelope-only' in sys.argv:
        feasibility()
    else:
        main()
