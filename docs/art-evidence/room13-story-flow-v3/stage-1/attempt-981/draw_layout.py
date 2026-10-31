"""Room13 layout proposal and analytic geometry checks. No runtime writes.
Run with Python 3 and Pillow. All coordinates are game units, +y down.
"""
from pathlib import Path
from collections import deque
import hashlib, json, math, re, subprocess
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
WORK = Path('/home/chernodubv/.hermes/workspaces/containment-art-roadmap')
REPO = Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3')
EXPECTED = 'dff12bbc91359e1588efd3a28ae9aef1298b95f7'
HEAD = subprocess.check_output(['git', '-C', str(REPO), 'rev-parse', 'HEAD'], text=True).strip()
assert HEAD == EXPECTED
src = REPO / 'src/game/roguelike/storyRoomTemplates.ts'
s = src.read_text()
rects = json.loads(re.search(r"'coolant-plant':(\[\[.*?\]\])", s).group(1))
w, h = map(int, re.search(r'width:(\d+),height:(\d+)', s).groups())
def anchor(key):
    return list(map(int, re.search(key+r':Object.freeze\(\{x:(\d+),y:(\d+)\}', s).groups()))
spawn, exit_ = anchor('spawn'), anchor('exit')
authored = (REPO/'src/game/roguelike/authoredRoomTopologies.ts').read_text()
assert "'coolant-plant':" not in authored, 'Authored override requires parser update'
assert rects == [[300,210,150,150],[750,210,150,150],[300,540,150,150],[750,540,150,150],[550,390,100,100]]
breaches = [[100,100],[1100,100],[100,780],[1100,780]]
assert '{x:100,y:100},{x:1100,y:100},{x:100,y:780},{x:1100,y:780}' in s
boundary = [[0,0],[w,0],[w,h],[0,h]]
roles = ['A1 heat exchanger','B1 heat exchanger','A2 pump / return','B2 pump / return','S low service saddle']
left = [[500,440],[500,150],[200,150],[200,750],[500,750],[500,440]]
right = [[700,440],[700,750],[1000,750],[1000,150],[700,150],[700,440]]
north = [[500,440],[500,330],[700,330],[700,440]]
south = [[500,440],[500,550],[700,550],[700,440]]
figure8 = left + north[1:] + right[1:] + list(reversed(south))[1:]
routes = {'west circuit':left,'east circuit':right,'central north bypass':north,'central south bypass':south,
          'spawn to exit north':[spawn,[500,440]]+north[1:]+[exit_],
          'spawn to exit south':[spawn,[500,440]]+south[1:]+[exit_],
          'complete figure eight':figure8}
activities = {'west service':[500,285],'east service':[700,285],'west return service':[500,615],
              'east return service':[700,615],'saddle north':[600,330],'saddle south':[600,550]}

# Exact Euclidean clearance to closed rectangles and the rectangular room edge.
def point_segment(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    q=dx*dx+dy*dy
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/q)) if q else 0
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def point_rect(p,r):
    x,y,rw,rh=r
    return math.hypot(max(x-p[0],0,p[0]-x-rw),max(y-p[1],0,p[1]-y-rh))
def hits(a,b,r):
    x,y,rw,rh=r
    lo,hi=0.,1.
    for av,bv,mn,mx in [(a[0],b[0],x,x+rw),(a[1],b[1],y,y+rh)]:
        dv=bv-av
        if dv==0:
            if not mn<=av<=mx: return False
        else:
            t0,t1=sorted(((mn-av)/dv,(mx-av)/dv))
            lo,hi=max(lo,t0),min(hi,t1)
            if lo>hi: return False
    return True
def segment_rect(a,b,r):
    if hits(a,b,r): return 0.
    x,y,rw,rh=r
    return min(point_rect(a,r),point_rect(b,r),*(point_segment(p,a,b) for p in [(x,y),(x+rw,y),(x+rw,y+rh),(x,y+rh)]))
def clearance(a,b):
    return min(a[0],b[0],w-a[0],w-b[0],a[1],b[1],h-a[1],h-b[1],*(segment_rect(a,b,r) for r in rects))
def conservative(a,b,radius):
    return clearance(a,b)>=radius and not any(hits(a,b,[x-radius,y-radius,rw+2*radius,rh+2*radius]) for x,y,rw,rh in rects)

records=[]
def check(name,passed,**details):
    records.append(dict(name=name,passed=bool(passed),**details))
check('source head pinned',HEAD==EXPECTED,head=HEAD)
check('source worktree clean before generation',not subprocess.check_output(['git','-C',str(REPO),'status','--porcelain'],text=True).strip())
check('actual topology retained',len(rects)==5,boundary=boundary,polygon_voids=[],rectangular_blockers=rects,
      note='No authored Room13 polygon override at this HEAD. Rectangle and five solids, not a custom figure-eight shell.')
for radius in (16,28):
    for name,path in routes.items():
        c=min(clearance(a,b) for a,b in zip(path,path[1:]))
        check(f'r{radius} {name}',c>=radius and all(conservative(a,b,radius) for a,b in zip(path,path[1:])),
              minimum_center_clearance=c,minimum_circle_edge_margin=c-radius,continuous_segments=len(path)-1)
        if 'circuit' in name or name=='complete figure eight':
            check(f'r{radius} reverse {name}',all(conservative(a,b,radius) for a,b in zip(path[1:],path)))
    points={'spawn':spawn,'exit':exit_,**activities,**{f'breach {i}':p for i,p in enumerate(breaches)},
            **{f'breach inward {i}':[p[0]+(56 if p[0]<600 else -56),p[1]] for i,p in enumerate(breaches)}}
    for name,p in points.items():
        check(f'r{radius} occupancy {name}',clearance(p,p)>=radius,center=p,clearance=clearance(p,p))
    # Grid is only the connectivity search. Every traversed grid edge has a
    # continuous analytic check, so no gaps can hide between sampled nodes.
    step=10
    nodes={(x,y) for x in range(0,w+1,step) for y in range(0,h+1,step) if clearance((x,y),(x,y))>=radius}
    remaining=set(nodes); sizes=[]; spawn_component=set()
    while remaining:
        start=next(iter(remaining)); remaining.remove(start); seen={start}; q=deque([start])
        while q:
            p=q.popleft()
            for v in [(p[0]+step,p[1]),(p[0]-step,p[1]),(p[0],p[1]+step),(p[0],p[1]-step)]:
                if v in remaining and clearance(p,v)>=radius:
                    remaining.remove(v);seen.add(v);q.append(v)
        sizes.append(len(seen))
        if tuple(spawn) in seen: spawn_component=seen
    connected={}
    for name,p in points.items():
        nearby=(min(nodes,key=lambda n:math.dist(n,p)))
        connected[name]=nearby in spawn_component and (list(nearby)==p or conservative(p,nearby,radius))
    check(f'r{radius} grid connectivity',len(sizes)==1 and all(connected.values()),grid_step=step,
          free_nodes=len(nodes),components=len(sizes),component_sizes=sorted(sizes,reverse=True),anchors_reachable=connected,
          limitation='Grid connectivity with analytically checked edges. Not a proof about every continuous free-space point or production actor movement.')
for name,a,b in [('north legal cross shot',[500,330],[700,330]),('south legal cross shot',[500,550],[700,550]),
                 ('west service shot',[200,440],[500,440]),('east service shot',[700,440],[1000,440])]:
    check(name,clearance(a,b)>0,from_point=a,to_point=b,minimum_clearance=clearance(a,b))
check('negative control central solid blocks straight route',clearance(spawn,exit_)==0)
check('negative control oversized circle rejects 100 unit slot',not conservative([500,210],[500,360],51))
check('negative control outside room rejected',clearance([-1,440],[-1,440])<0)
# Proposed symbols and solid detail stay inside owning collision footprint.
equipment=[]
for i,(x,y,rw,rh) in enumerate(rects):
    bounds=[x+8,y+8,rw-16,rh-16]
    equipment.append({'role':roles[i],'collision_footprint':rects[i],'symbol_bounds':bounds})
    bx,by,bw,bh=bounds
    check('contained role '+roles[i],bx>=x and by>=y and bx+bw<=x+rw and by+bh<=y+rh)

source_paths=[src,REPO/'src/game/roguelike/authoredRoomTopologies.ts',REPO/'src/game/roguelike/roomTemplates.ts',
              REPO/'src/game/roguelike/storyRooms.ts',REPO/'src/game/world/expeditionGeometry.ts',REPO/'src/render/AuthoredRooms.ts',
              WORK/'rollout-sources/room13-brief.json',WORK/'coolant-plant/story-flow-v3/stage-0/attempt-980/brief.md',
              WORK/'coolant-plant/story-flow-v3/stage-0/attempt-980/draw_story.py']
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in source_paths}
manifest={'template_id':'coolant-plant','campaign_room':13,'stage':1,'attempt':981,'kind':'top-down layout proposal, not gameplay',
          'source_head':HEAD,'source_sha256':hashes,'units':'game units; x right, y down; 1 PNG map pixel per unit',
          'room':{'width':w,'height':h,'boundary':boundary,'polygon_voids':[],'obstacles':rects,'spawn':spawn,'exit':exit_,'breaches':breaches},
          'topology_changes':[],'equipment':equipment,'routes':routes,'activity_centers':activities,
          'focal_point':{'center':[600,440],'role':'low service saddle','solid':True,'walkable':False},
          'connections':'Supply and return pair each west/east exchanger with its pump. Recessed connections beneath flush deck only. No new floor solids.',
          'constraint':'Current central saddle stays collision-solid. Cross above or below it, never through it. No new hazard, interaction, camera or gameplay change.'}

# Diagram. Shapes are simple footprint allocations, not model designs.
im=Image.new('RGB',(1800,1320),'#101c24');d=ImageDraw.Draw(im)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(x,y,t,size=22,color='#e6edeb'):
    d.text((x,y),t,font=ImageFont.truetype(FONT,size),fill=color)
def pt(p):return (50+p[0],235+p[1])
def box(r,fill,outline=None,width=2):
    x,y,rw,rh=r;d.rectangle([pt((x,y)),pt((x+rw,y+rh))],fill=fill,outline=outline,width=width)
def route(path,color,width=5):
    d.line([pt(p) for p in path],fill=color,width=width,joint='curve')
def arrow(a,b,color):
    dx,dy=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dy);ux,uy=dx/l,dy/l
    tip=b;back=(b[0]-14*ux,b[1]-14*uy)
    d.polygon([pt(tip),pt((back[0]-7*uy,back[1]+7*ux)),pt((back[0]+7*uy,back[1]-7*ux))],fill=color)
def marker(p,r,color,fill=None):
    x,y=pt(p);d.ellipse((x-r,y-r,x+r,y+r),fill=fill,outline=color,width=3)
text(50,32,'13 / COOLANT PLANT',42)
text(50,91,'Layout draft  /  Top-down proposal, not gameplay',25,'#b9c8ca')
text(50,140,'Keep life support working. Descend through the pumps, knowing the fatal cost.',25,'#75c7bd')
text(50,196,'CANONICAL PLAN  /  1200 x 880 game units  /  +y down',19,'#b9c8ca')
box([0,0,w,h],'#1e3038','#a6b8bc',4)
# Calm scale grid, clipped to the room.
for x in range(100,w,100):route([[x,3],[x,h-3]],'#293c44',1)
for y in range(100,h,100):route([[3,y],[w-3,y]],'#293c44',1)
# Under-deck conceptual connections, not collision geometry or route lines.
for x in (375,825):
    for y in range(365,540,16):route([[x-9,y],[x-9,min(y+8,540)]],'#6a9193',2);route([[x+9,y],[x+9,min(y+8,540)]],'#6a9193',2)
for xx in range(458,745,16):
    if 550<=xx<=650:continue
    route([[xx,440],[min(xx+8,745),440]],'#6a9193',2)
# Radius28 envelopes shown as thin offset outlines around solids.
for x,y,rw,rh in rects:
    d.rounded_rectangle([pt((x-28,y-28)),pt((x+rw+28,y+rh+28))],radius=28,outline='#52646b',width=1)
for i,(x,y,rw,rh) in enumerate(rects):
    box([x,y,rw,rh],'#365657' if i<4 else '#725f3e','#91b7b0' if i<4 else '#e0b66d',3)
    bx,by,bw,bh=equipment[i]['symbol_bounds']
    if i<2:
        box([bx+8,by+28,bw-16,60],'#578985','#b3cbc6',2)
        route([[bx+8,by+10],[bx+bw-8,by+10],[bx+bw-8,by+25]],'#a6b7b9',5)
        route([[bx+8,by+92],[bx+8,by+111],[bx+bw-8,by+111]],'#a6b7b9',5)
    elif i<4:
        marker([x+47,y+74],25,'#b3cbc6','#578985')
        box([x+83,y+54,48,40],'#789398','#a6b7b9',2)
        route([[x+73,y+74],[x+82,y+74]],'#c1cfcc',5)
    else:
        box([bx+10,by+18,bw-20,bh-36],'#97825b','#d5bd87',2)
    label=['A1','B1','A2','B2','S'][i]
    text(*pt((x+12,y+10)),label,20,'#ffffff')
# Alternative circuits with a shared pair of central bypasses.
route(left,'#71d3bd',5);route(right,'#b6a0ed',5)
route(north,'#edbb68',6);route(south,'#edbb68',6)
route([spawn,[500,440]],'#edbb68',5);route([[700,440],exit_],'#edbb68',5)
for a,b,c in [([200,340],[200,400],'#71d3bd'),([320,750],[400,750],'#71d3bd'),([1000,520],[1000,450],'#b6a0ed'),([880,150],[800,150],'#b6a0ed'),([560,330],[640,330],'#edbb68'),([560,550],[640,550],'#edbb68'),([1020,440],[1070,440],'#edbb68')]:arrow(a,b,c)
for name,p in activities.items():marker(p,16,'#e9d8ae')
for p in breaches:
    x,y=pt(p);d.polygon([(x,y-8),(x+8,y),(x,y+8),(x-8,y)],outline='#bd7d7c',width=2)
marker(spawn,16,'#e2eeeb','#4a8378');marker(exit_,16,'#e2eeeb','#8d7045')
text(*pt((36,470)),'ENTRY',19);text(*pt((1035,470)),'DESCENT',19)
text(*pt((245,70)),'A / exchange + pump',22,'#8dd5c5')
text(*pt((745,70)),'B / exchange + pump',22,'#c9b8ef')
text(*pt((516,267)),'NORTH CROSS',17,'#edbb68')
text(*pt((518,580)),'SOUTH CROSS',17,'#edbb68')
text(*pt((40,823)),'Closed wall boundary. No polygon voids in current code.',19,'#a7b9bd')
# Sidebar is deliberately separate from the map.
sx=1300
text(sx,235,'LAYOUT INTENT',25,'#edbb68')
for yy,t in [(282,'Two working installations.'),(318,'A1 / B1: heat exchangers.'),(354,'A2 / B2: pump + return.'),(408,'S: low service saddle.'),(444,'Retain its solid footprint.'),(480,'Walk north or south of it.'),(534,'Paired circuits form an eight'),(570,'through shared cross routes.'),(606,'No pipes across feet.'),(642,'Connections below flush deck.')]:text(sx,yy,t,21)
text(sx,706,'READING THE PLAN',24,'#edbb68')
for yy,c,t in [(752,'#71d3bd','West circulation circuit'),(793,'#b6a0ed','East circulation circuit'),(834,'#edbb68','Entry / crossing / descent'),(875,'#52646b','28-unit clearance envelope')]:
    d.line([(sx,yy+12),(sx+42,yy+12)],fill=c,width=5);text(sx+57,yy,t,18)
marker_point=(sx+21,934);d.ellipse((marker_point[0]-12,marker_point[1]-12,marker_point[0]+12,marker_point[1]+12),outline='#e9d8ae',width=3)
text(sx+57,921,'Service standing area',18)
text(sx,976,'Open circles are floor space.',19,'#b9c8ca')
text(sx,1010,'Not new valve interactions.',19,'#b9c8ca')
text(sx,1052,'Diamonds: canonical breaches.',18,'#bd7d7c')
text(50,1150,'CHECKED / Radius 16 and 28: both circuits, both cross routes, entry to descent.',24,'#8dd5c5')
text(50,1188,'Narrowest drawn route: 50 units from solids. Radius 28 leaves 22 units of margin.',22)
text(50,1224,'Analytic clearance + grid connectivity only. No runtime movement, combat, model or release claim.',21,'#b9c8ca')
text(50,1270,'Source dff12bbc9135  /  Existing rectangular topology retained  /  Stage 1, attempt 981',18,'#a7b9bd')
image_path=OUT/'layout-draft.png';im.save(image_path)
with Image.open(image_path) as decoded:
    decoded.load();check('PNG decoded',decoded.size==(1800,1320) and decoded.mode=='RGB',size=list(decoded.size),mode=decoded.mode)
check('source bytes unchanged after generation',all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==digest for p,digest in hashes.items()))
check('source worktree clean after generation',not subprocess.check_output(['git','-C',str(REPO),'status','--porcelain'],text=True).strip())
summary={'checks':len(records),'passed':sum(r['passed'] for r in records),'failures':sum(not r['passed'] for r in records)}
checks={'kind':'analytic layout validation, not production movement','summary':summary,'results':records,
        'method':'Exact segment-to-rectangle Euclidean clearance. Named routes also pass conservative expanded-rectangle traversal. The 10-unit grid uses circular occupancy and continuous Euclidean edge checks consistently. No polygon override exists for Room13 at pinned HEAD.',
        'development_note':'Initial grid used circular nodes with square-expanded edges, leaving 20 artificial isolated corner nodes at radius28. Corrected the grid to use Euclidean circle clearance for both nodes and edges. Named route checks retain the stricter square-expanded test. No room geometry changed.',
        'not_tested':['Runtime player or enemy movement','Pursuit or combat','3D mesh/collision matching','Render integration'],
        'source_sha256':hashes,'generator_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'png_sha256':hashlib.sha256(image_path.read_bytes()).hexdigest()}
(OUT/'layout-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
brief='''# Coolant plant layout draft

Keep the existing room topology. At the pinned current HEAD, Room13 has a 1200 by 880 rectangular boundary, five rectangular solid obstacles and no polygon voids or Room13 authored topology override. The historical brief's figure-eight shell is not already implemented here.

West installation A uses the northwest exchanger footprint and southwest pump/return footprint. East installation B mirrors those roles. The center 100 by 100 footprint becomes a low service saddle, still collision-solid. Recessed supply and return connections imply working life support without adding floor obstacles. Equipment symbols fit within the existing footprints. This is an allocation diagram, not detailed modeling.

Both outer circuits remain. The continuous figure-eight route combines them through shared north and south saddle bypasses. Do not route through the saddle or treat low height as legal firing space. Entry stays at 100/440 and descent at 1100/440. Open-circle service areas remain ordinary usable floor, with no valve interaction or liquid hazard.

The PNG shows the full canonical room at one map pixel per game unit. Gray outlines mark radius28 exclusion envelopes. Thin dashed plumbing indicates below-deck connections, not walking routes or new blockers. Colored route lines are diagram annotations, not proposed floor markings.

## Checks

'''+f"{summary['passed']} of {summary['checks']} analytic checks passed, {summary['failures']} failures. Radius16 and radius28 pass continuous segments on both loops in both directions, both central bypasses and entry-to-exit alternatives. The drawn routes have a minimum center clearance of 50 units and a radius28 edge margin of 22 units. The 10-unit grid has one reachable component at each tested radius. All service centers, spawn, exit, breach anchors and their inward offsets connect. Legal central shot segments avoid the saddle. Negative controls reject the straight line through the saddle, a radius51 circle in the 100-unit slot and an outside-room center.\n\n"+'''This is analytic geometry validation. It is not evidence of production movement, pursuit, hit feedback, enemy behavior or in-scene visibility. Runtime checks belong to later implementation. No source changes, guard calls, receipts, approval records, commits or publication writes were made.

## Reproduce

Run `python /home/chernodubv/.hermes/workspaces/containment-art-roadmap/coolant-plant/story-flow-v3/stage-1/attempt-981/draw_layout.py` with Python3, Pillow and DejaVuSans. The generator asserts the source HEAD and parses the live room footprint and anchors. It refuses an unexpected Room13 topology override.

## Source pins

'''+f'Current HEAD: `{HEAD}`. The canonical brief remains pinned to its historical source commit, not silently updated.\n\n'+''.join(f'- `{p}` SHA256 `{v}`\n' for p,v in hashes.items())
(OUT/'brief.md').write_text(brief)
print(json.dumps(summary));print('PNG',image_path);print('sha256',checks['png_sha256'])
assert summary['failures']==0, 'See checks.json for failed assertions'
