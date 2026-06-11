/* ============================================================
   scenes.js — 커널 속으로: 구조 도식 (2편 콘텐츠팩)
   viewBox 0 0 600 420 공통. hot()=클릭 핫스팟.
   ============================================================ */
(function () {
  const C = {
    pan:'#0c121b', pan2:'#101a25', ln:'#1b2733', ln2:'#26384a',
    ink:'#e2e9f0', dim:'#7e8d9d', fnt:'#566578',
    vio:'#b08ae0', vioD:'#7a5fa0', cyan:'#56d6cf', cyanD:'#2c7a78',
    grn:'#86e6a2', warn:'#e0916f', metal:'#33414f',
  };

  function hot(kid, label, body, lx, ly, anchor) {
    anchor = anchor || 'start';
    return `<g class="hot" data-kid="${kid}" tabindex="0" role="button" aria-label="${label}">
      ${body}
      <text class="hot__label" x="${lx}" y="${ly}" text-anchor="${anchor}">${label}</text>
      <text class="hot__go" x="${lx}" y="${ly + 13}" text-anchor="${anchor}">▸ 들어가기</text>
    </g>`;
  }
  const lbl = (x, y, t, a) => `<text class="s-label" x="${x}" y="${y}" text-anchor="${a || 'start'}">${t}</text>`;
  const svg = (inner) => `<svg class="scene" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;
  function flow(d, col, n, dur, r) {
    n = n || 3; dur = dur || 2.4; r = r || 3;
    let s = '';
    for (let i = 0; i < n; i++) {
      s += `<circle r="${r}" fill="${col}" opacity=".9"><animateMotion dur="${dur}s" begin="${(-dur * i / n).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>`;
    }
    return s;
  }
  function arrowR(x1, y, x2, col) {
    return `<path d="M${x1} ${y} H${x2}" stroke="${col}" stroke-width="2" fill="none"/>
            <path d="M${x2 - 9} ${y - 6} L${x2} ${y} L${x2 - 9} ${y + 6}" fill="${col}"/>`;
  }
  // 꼬불거리는 실행의 실
  function thread(x, y, w, col) {
    return `<path d="M${x} ${y} q${w*.12} -10 ${w*.25} 0 t${w*.25} 0 t${w*.25} 0 t${w*.25} 0" fill="none" stroke="${col}" stroke-width="2"/>
            ${flow(`M${x} ${y} q${w*.12} -10 ${w*.25} 0 t${w*.25} 0 t${w*.25} 0 t${w*.25} 0`, col, 1, 2.2, 3)}`;
  }

  const SCENES = {

    /* ─── D0 프로세스: 우주의 전경 ─── */
    process: svg(`
      <rect x="40" y="30" width="520" height="360" rx="12" fill="${C.pan}" stroke="${C.vio}" stroke-width="1.5"/>
      <rect x="40" y="30" width="520" height="34" rx="12" fill="${C.pan2}"/>
      <circle cx="62" cy="47" r="5" fill="${C.warn}"/><circle cx="80" cy="47" r="5" fill="${C.vio}"/><circle cx="98" cy="47" r="5" fill="${C.grn}"/>
      <text x="300" y="52" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.dim}">myapp — 실행 중 (PID 1234)</text>

      ${hot('addrspace', '주소 공간',
        `<rect class="hot__shape" x="64" y="84" width="150" height="240" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
         ${[['스택 ↓','#1a2433',96],['(빈 공간)','none',140],['힙 ↑','#1a2433',184],['데이터','#16222e',228],['코드','#221a2e',272]].map(([t,f,y]) => `
           <rect x="76" y="${y}" width="126" height="38" rx="3" fill="${f==='none'?C.pan:f}" stroke="${C.ln2}" ${f==='none'?'stroke-dasharray="3 4"':''}/>
           <text x="139" y="${y+24}" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.dim}">${t}</text>`).join('')}`,
        139, 344, 'middle')}

      ${hot('threads', '스레드',
        `<rect class="hot__shape" x="240" y="84" width="220" height="120" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
         ${thread(254, 120, 190, C.cyan)}
         ${thread(254, 152, 190, C.grn)}
         ${thread(254, 184, 190, C.vio)}`,
        350, 224, 'middle')}

      ${hot('syscall', '시스템 콜',
        `<rect class="hot__shape" x="240" y="262" width="220" height="62" rx="6" fill="#221a2e" stroke="${C.vio}" stroke-width="1.5"/>
         <text x="350" y="288" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.vio}">write( ) · read( ) · open( )</text>
         <text x="350" y="306" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">↓ 커널로 들어가는 문</text>`,
        350, 344, 'middle')}

      <rect x="484" y="84" width="56" height="240" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
      <text x="512" y="106" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">열린 파일</text>
      ${[0,1,2].map(i => `<rect x="492" y="${118+i*30}" width="40" height="22" rx="3" fill="${C.pan}" stroke="${C.cyanD}"/>
        <text x="512" y="${133+i*30}" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.cyan}">fd ${i}</text>`).join('')}
      <text x="300" y="408" text-anchor="middle" class="s-label" fill="${C.fnt}">자기만의 메모리 지도 + 실행의 실 + 열린 파일 = 프로세스</text>
    `),

    /* ─── D1 주소 공간 ─── */
    addrspace: svg(`
      ${lbl(40, 40, 'ADDRESS SPACE · 메모리 지도')}
      <text x="160" y="74" text-anchor="end" font-family="monospace" font-size="9" fill="${C.fnt}">높은 주소</text>
      <rect x="180" y="60" width="240" height="56" rx="4" fill="#1a2433" stroke="${C.cyan}"/>
      <text x="300" y="84" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.cyan}">스택 — 함수 호출·지역 변수</text>
      <path d="M300 116 V146" stroke="${C.cyan}" stroke-width="2"/><path d="M294 137 L300 146 L306 137" fill="${C.cyan}"/>
      <rect x="180" y="152" width="240" height="50" rx="4" fill="${C.pan}" stroke="${C.ln2}" stroke-dasharray="4 4"/>
      <text x="300" y="181" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.fnt}">빈 공간 — 둘이 서로를 향해 자란다</text>
      <path d="M300 238 V208" stroke="${C.grn}" stroke-width="2"/><path d="M294 217 L300 208 L306 217" fill="${C.grn}"/>
      <rect x="180" y="244" width="240" height="48" rx="4" fill="#16301f" stroke="${C.grn}"/>
      <text x="300" y="272" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.grn}">힙 — malloc·new가 사는 곳</text>
      <rect x="180" y="298" width="240" height="38" rx="4" fill="#16222e" stroke="${C.ln2}"/>
      <text x="300" y="321" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.dim}">데이터 — 전역 변수</text>
      <rect x="180" y="342" width="240" height="38" rx="4" fill="#221a2e" stroke="${C.vio}"/>
      <text x="300" y="365" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.vio}">코드 — 명령어 (읽기 전용)</text>
      <text x="160" y="372" text-anchor="end" font-family="monospace" font-size="9" fill="${C.fnt}">낮은 주소</text>
      <text x="455" y="84" font-family="monospace" font-size="8" fill="${C.fnt}">← 재귀가 깊으면</text>
      <text x="455" y="96" font-family="monospace" font-size="8" fill="${C.fnt}">   스택 오버플로</text>
      <text x="455" y="272" font-family="monospace" font-size="8" fill="${C.fnt}">← 안 돌려주면</text>
      <text x="455" y="284" font-family="monospace" font-size="8" fill="${C.fnt}">   메모리 누수</text>
    `),

    /* ─── D1 스레드 ─── */
    threads: svg(`
      ${lbl(40, 40, 'THREADS · 한 우주, 여러 실')}
      <rect x="60" y="60" width="480" height="220" rx="8" fill="${C.pan2}" stroke="${C.ln2}"/>
      <text x="80" y="84" font-family="monospace" font-size="9" fill="${C.fnt}">프로세스 (공유 우주)</text>
      ${[['T1', 120, C.cyan], ['T2', 170, C.grn], ['T3', 220, C.vio]].map(([t, y, col]) => `
        <text x="92" y="${y+4}" font-family="monospace" font-size="9" fill="${col}">${t}</text>
        ${thread(116, y, 290, col)}
        <rect x="430" y="${y-16}" width="88" height="32" rx="3" fill="${C.pan}" stroke="${col}" opacity=".8"/>
        <text x="474" y="${y+4}" text-anchor="middle" font-family="monospace" font-size="8" fill="${col}">자기 스택·레지스터</text>`).join('')}
      <rect x="60" y="300" width="480" height="56" rx="6" fill="#16301f" stroke="${C.grn}"/>
      <text x="300" y="324" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.grn}">공유: 힙 · 전역 변수 · 열린 파일</text>
      <text x="300" y="344" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.warn}">⚠ 두 실이 동시에 만지면 — 경쟁 상태(race)</text>
      ${[120,170,220].map(y => `<path d="M380 ${y} Q400 ${(y+300)/2} 300 300" fill="none" stroke="${C.ln2}" stroke-width="1" opacity=".5"/>`).join('')}
      <text x="300" y="396" text-anchor="middle" class="s-label" fill="${C.fnt}">실은 따로, 우주는 함께 — 빠르지만 조심스러운 동거</text>
    `),

    /* ─── D1 시스템 콜: 문 ─── */
    syscall: svg(`
      ${lbl(40, 40, 'SYSTEM CALL · 커널로 가는 문')}
      <rect x="50" y="70" width="210" height="260" rx="8" fill="${C.pan2}" stroke="${C.ln2}"/>
      <text x="155" y="96" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.fnt}">유저 공간 (Ring 3)</text>
      <rect x="70" y="116" width="170" height="64" rx="5" fill="${C.pan}" stroke="${C.cyanD}"/>
      <text x="155" y="142" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.cyan}">printf("안녕");</text>
      <text x="155" y="162" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">↓ 라이브러리(libc)</text>
      <rect x="70" y="200" width="170" height="52" rx="5" fill="#221a2e" stroke="${C.vio}"/>
      <text x="155" y="222" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.vio}">write(1, "안녕", 6)</text>
      <text x="155" y="240" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">시스템 콜 호출</text>
      <!-- 벽과 문 -->
      <rect x="285" y="60" width="30" height="300" fill="#0a0712" stroke="${C.vioD}"/>
      ${hot('trap', '문이 열리는 순간',
        `<rect class="hot__shape" x="281" y="180" width="38" height="70" rx="5" fill="#221a2e" stroke="${C.vio}" stroke-width="2"/>
         <text x="300" y="220" text-anchor="middle" font-family="monospace" font-size="14" fill="${C.vio}">⍈</text>`,
        300, 282, 'middle')}
      <text x="300" y="86" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.vioD}" transform="rotate(90 300 86)"></text>
      <rect x="340" y="70" width="210" height="260" rx="8" fill="#100b18" stroke="${C.vioD}"/>
      <text x="445" y="96" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.vio}">커널 공간 (Ring 0)</text>
      <text x="445" y="210" text-anchor="middle" font-family="monospace" font-size="22" fill="${C.vioD}" opacity=".6">⊚</text>
      <text x="445" y="240" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">(문 너머의 세계)</text>
      ${flow('M155 252 V282 H281', C.vio, 2, 2.0, 2.5)}
      <path d="M155 252 V282 H281" fill="none" stroke="${C.vioD}" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>
      <text x="300" y="396" text-anchor="middle" class="s-label" fill="${C.fnt}">printf 한 줄의 뒤편 — 문은 하나뿐이고, 문지기는 커널이다</text>
    `),

    /* ─── D2 트랩: 국경 통과 절차 ─── */
    trap: svg(`
      ${lbl(40, 40, 'TRAP · Ring 3 → Ring 0 통과 절차')}
      ${[['① 번호 적재', 'rax ← 1 (write)', C.cyan], ['② trap 명령', 'syscall 실행', C.vio], ['③ 권한 상승', 'Ring 3 → 0\n레지스터 저장', C.warn], ['④ 표에서 점프', '핸들러 테이블[1]', C.grn]].map(([t, d, col], i) => `
        <rect x="${56 + i * 130}" y="100" width="112" height="84" rx="6" fill="${C.pan2}" stroke="${col}"/>
        <text x="${112 + i * 130}" y="128" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${col}">${t}</text>
        ${d.split('\n').map((line, k) => `<text x="${112 + i * 130}" y="${150 + k * 14}" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.dim}">${line}</text>`).join('')}
        ${i < 3 ? arrowR(168 + i * 130, 142, 186 + i * 130, C.ln2) : ''}`).join('')}
      ${flow('M60 142 H540', C.vio, 2, 2.6, 2.5)}
      <!-- 시스템 콜 표 -->
      <text x="120" y="232" font-family="monospace" font-size="9" fill="${C.fnt}">시스템 콜 표 (커널이 정한 입구만):</text>
      ${[['0', 'read'], ['1', 'write'], ['2', 'open'], ['57', 'fork'], ['60', 'exit']].map(([n, f], i) => `
        <rect x="${100 + i * 84}" y="244" width="72" height="34" rx="4" fill="${i===1?'#221a2e':C.pan2}" stroke="${i===1?C.vio:C.ln2}"/>
        <text x="${136 + i * 84}" y="265" text-anchor="middle" font-family="monospace" font-size="9" fill="${i===1?C.vio:C.dim}">${n}: ${f}</text>`).join('')}
      ${hot('kernel', '커널로',
        `<rect class="hot__shape" x="200" y="310" width="200" height="58" rx="6" fill="#100b18" stroke="${C.vio}" stroke-width="1.5"/>
         <text x="300" y="338" text-anchor="middle" font-family="monospace" font-size="12" fill="${C.vio}">⊚ Ring 0 진입</text>
         <text x="300" y="356" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">최고 권한의 세계</text>`,
        300, 392, 'middle')}
      ${flow('M136 282 Q200 300 240 320', C.vio, 1, 1.8, 2.5)}
    `),

    /* ─── D3 커널: 플로어플랜 ─── */
    kernel: svg(`
      <rect x="50" y="36" width="500" height="350" rx="10" fill="#100b18" stroke="${C.vio}" stroke-width="1.5"/>
      ${lbl(66, 62, 'THE KERNEL · Ring 0 플로어플랜')}
      ${hot('sched', '스케줄러',
        `<rect class="hot__shape" x="72" y="80" width="220" height="120" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
         ${[0,1,2].map(i => `<rect x="${88+i*52}" y="108" width="44" height="26" rx="3" fill="${C.pan}" stroke="${C.cyanD}"/>
           <text x="${110+i*52}" y="125" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.cyan}">P${i+1}</text>`).join('')}
         <text x="106" y="160" font-family="monospace" font-size="8" fill="${C.fnt}">런큐 →</text>
         <rect x="236" y="146" width="40" height="28" rx="3" fill="${C.metal}" stroke="${C.vio}"/>
         <text x="256" y="164" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.vio}">CPU</text>
         ${flow('M132 158 H236', C.cyan, 2, 1.8, 2)}`,
        182, 218, 'middle')}
      ${hot('memmgr', '메모리 관리자',
        `<rect class="hot__shape" x="308" y="80" width="220" height="120" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
         ${[0,1,2,3,4,5].map(i => `<rect x="${326+(i%3)*60}" y="${102+Math.floor(i/3)*38}" width="48" height="28" rx="3" fill="${i===4?'#16301f':C.pan}" stroke="${i===4?C.grn:C.ln2}"/>`).join('')}
         <text x="418" y="184" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">페이지 프레임 분배</text>`,
        418, 218, 'middle')}
      ${hot('vfs', '파일시스템',
        `<rect class="hot__shape" x="72" y="240" width="220" height="110" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
         <text x="110" y="272" font-family="monospace" font-size="9" fill="${C.dim}">/</text>
         <path d="M116 268 L150 288 M116 268 L150 308" stroke="${C.ln2}"/>
         <text x="156" y="292" font-family="monospace" font-size="9" fill="${C.dim}">home/</text>
         <text x="156" y="312" font-family="monospace" font-size="9" fill="${C.dim}">etc/</text>
         <text x="230" y="300" font-family="monospace" font-size="8" fill="${C.fnt}">"모든 것은 파일"</text>`,
        182, 374, 'middle')}
      ${hot('driver', '드라이버',
        `<rect class="hot__shape" x="308" y="240" width="220" height="110" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
         ${[['디스크',332],['키보드',398],['NIC',464]].map(([t,x]) => `
           <rect x="${x}" y="262" width="56" height="26" rx="3" fill="${C.pan}" stroke="${C.cyanD}"/>
           <text x="${x+28}" y="279" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.cyan}">${t}</text>
           <path d="M${x+28} 288 V316" stroke="${C.ln2}"/>`).join('')}
         <text x="418" y="334" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">장치마다 통역사 하나씩</text>`,
        418, 374, 'middle')}
    `),

    /* ─── D4 스케줄러 ─── */
    sched: svg(`
      ${lbl(40, 40, 'SCHEDULER · 다음 주자는 누구인가')}
      <text x="70" y="86" font-family="monospace" font-size="9" fill="${C.fnt}">런큐 (실행 준비 완료):</text>
      ${[['P7 · 에디터', 0], ['P3 · 브라우저', 1], ['P9 · 음악', 2]].map(([t, i]) => `
        <rect x="${70}" y="${100 + i * 48}" width="180" height="38" rx="5" fill="${C.pan2}" stroke="${i===0?C.vio:C.ln2}"/>
        <text x="${160}" y="${124 + i * 48}" text-anchor="middle" font-family="monospace" font-size="9" fill="${i===0?C.vio:C.dim}">${t}</text>`).join('')}
      ${arrowR(250, 119, 320, C.vio)}
      ${flow('M252 119 H318', C.vio, 2, 1.6, 2.5)}
      <rect x="324" y="88" width="130" height="80" rx="8" fill="${C.metal}" stroke="${C.vio}" stroke-width="1.5"/>
      <text x="389" y="122" text-anchor="middle" font-family="monospace" font-size="11" fill="${C.ink}">CPU 코어</text>
      <text x="389" y="146" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.grn}">실행 중: P1</text>
      <!-- 타이머 -->
      <circle cx="510" cy="110" r="28" fill="${C.pan2}" stroke="${C.warn}"/>
      <path d="M510 110 L510 92 M510 110 L522 118" stroke="${C.warn}" stroke-width="2"/>
      <text x="510" y="156" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.warn}">타이머 ⚡ 수 ms마다</text>
      <path d="M482 122 Q450 140 454 128" fill="none"/>
      ${flow('M488 128 Q460 150 454 128 M488 128 H458', C.warn, 1, 1.6, 2)}
      <!-- 결정 분기 -->
      <path d="M389 168 V200" stroke="${C.ln2}" stroke-width="1.5"/>
      <rect x="280" y="204" width="220" height="44" rx="6" fill="${C.pan2}" stroke="${C.gold ? C.gold : '#7a5fa0'}"/>
      <text x="390" y="231" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.vio}">계속 달리게 둘까, 교체할까?</text>
      ${hot('ctxswitch', '교체한다면 — 컨텍스트 스위치',
        `<rect class="hot__shape" x="120" y="288" width="360" height="64" rx="6" fill="#221a2e" stroke="${C.vio}" stroke-width="1.5"/>
         <text x="300" y="316" text-anchor="middle" font-family="monospace" font-size="11" fill="${C.vio}">P1 ⇄ P7 — 우주를 통째로 교체</text>
         <text x="300" y="336" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">레지스터 저장 · 복원 · 지도 교체</text>`,
        300, 380, 'middle')}
      ${flow('M390 248 V288', C.vio, 1, 1.4, 2.5)}
    `),

    /* ─── D5 컨텍스트 스위치 ─── */
    ctxswitch: svg(`
      ${lbl(40, 40, 'CONTEXT SWITCH · 우주 교체의 순간')}
      <rect x="60" y="80" width="170" height="190" rx="8" fill="${C.pan2}" stroke="${C.cyan}"/>
      <text x="145" y="106" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.cyan}">P1의 PCB</text>
      ${[['PC', '0x4F2A'], ['SP', '0x7FFC'], ['RAX', '42'], ['지도', 'PT₁']].map(([k, v], i) => `
        <rect x="76" y="${118 + i * 36}" width="138" height="28" rx="3" fill="${C.pan}" stroke="${C.ln2}"/>
        <text x="90" y="${136 + i * 36}" font-family="monospace" font-size="8.5" fill="${C.fnt}">${k}</text>
        <text x="200" y="${136 + i * 36}" text-anchor="end" font-family="monospace" font-size="8.5" fill="${C.cyan}">${v}</text>`).join('')}
      <rect x="370" y="80" width="170" height="190" rx="8" fill="${C.pan2}" stroke="${C.grn}"/>
      <text x="455" y="106" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.grn}">P7의 PCB</text>
      ${[['PC', '0x11B0'], ['SP', '0x7E10'], ['RAX', '7'], ['지도', 'PT₇']].map(([k, v], i) => `
        <rect x="386" y="${118 + i * 36}" width="138" height="28" rx="3" fill="${C.pan}" stroke="${C.ln2}"/>
        <text x="400" y="${136 + i * 36}" font-family="monospace" font-size="8.5" fill="${C.fnt}">${k}</text>
        <text x="510" y="${136 + i * 36}" text-anchor="end" font-family="monospace" font-size="8.5" fill="${C.grn}">${v}</text>`).join('')}
      <rect x="262" y="140" width="76" height="70" rx="8" fill="${C.metal}" stroke="${C.vio}" stroke-width="1.5"/>
      <text x="300" y="180" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.ink}">CPU</text>
      ${arrowR(230, 158, 262, C.cyan)}
      <text x="246" y="148" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.cyan}">①저장</text>
      <path d="M370 192 H338" stroke="${C.grn}" stroke-width="2"/><path d="M347 186 L338 192 L347 198" fill="${C.grn}"/>
      <text x="354" y="210" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.grn}">②복원</text>
      ${flow('M232 158 H260', C.cyan, 1, 1.2, 2.5)}
      ${flow('M368 192 H340', C.grn, 1, 1.2, 2.5)}
      <text x="300" y="312" text-anchor="middle" class="s-label" fill="${C.dim}">P7은 멈췄던 그 명령부터, 멈춘 적 없다는 듯 이어 달린다</text>
      <text x="300" y="340" text-anchor="middle" class="s-label" fill="${C.warn}">숨은 비용: 캐시·TLB가 식는다 (1편의 그 캐시!)</text>
      <text x="300" y="372" text-anchor="middle" class="s-label" fill="${C.fnt}">1초에 수천 번 — 그래서 모든 앱이 "동시에" 도는 것처럼 보인다</text>
    `),

    /* ─── D4 메모리 관리자 ─── */
    memmgr: svg(`
      ${lbl(40, 40, 'MEMORY MANAGER · 정책의 방')}
      <text x="90" y="80" font-family="monospace" font-size="9" fill="${C.fnt}">물리 프레임 (시계 바늘 = Clock 교체):</text>
      ${(function(){
        const cx=180, cy=190, R=80; let s='';
        for(let i=0;i<8;i++){
          const a=i/8*Math.PI*2-Math.PI/2, x=cx+Math.cos(a)*R-20, y=cy+Math.sin(a)*R-14;
          const used=[1,1,0,1,1,1,0,1][i];
          s+=`<rect x="${x}" y="${y}" width="40" height="28" rx="3" fill="${used?'#16301f':C.pan}" stroke="${used?'#3f7a52':C.ln2}" ${used?'':'stroke-dasharray="3 3"'}/>
              <text x="${x+20}" y="${y+18}" text-anchor="middle" font-family="monospace" font-size="8" fill="${used?C.grn:C.fnt}">F${i}</text>`;
        }
        s+=`<g class="spin-slow" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy} L${cx} ${cy-58}" stroke="#b08ae0" stroke-width="3" stroke-linecap="round"/></g>
            <circle cx="${cx}" cy="${cy}" r="7" fill="#7a5fa0"/>`;
        return s;
      })()}
      <text x="180" y="312" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">바늘이 돌며 "최근에 쓰였나?" 검사 — 세컨드 찬스</text>
      <rect x="360" y="100" width="180" height="76" rx="6" fill="${C.pan2}" stroke="${C.warn}"/>
      <text x="450" y="130" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${C.warn}">💾 스왑 (디스크)</text>
      <text x="450" y="152" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">쫓겨난 페이지의 유배지</text>
      ${flow('M268 160 Q320 130 360 130', C.warn, 1, 2.2, 2.5)}
      <rect x="360" y="208" width="180" height="100" rx="6" fill="${C.pan2}" stroke="${C.grn}"/>
      <text x="450" y="234" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${C.grn}">CoW — 복사한 척</text>
      <text x="450" y="258" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.dim}">fork() → 지도만 복사</text>
      <text x="450" y="276" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.dim}">정말 쓸 때만 진짜 복사</text>
      <text x="300" y="368" text-anchor="middle" class="s-label" fill="${C.fnt}">1편의 MMU가 지도를 "읽는" 쪽이라면, 여기는 지도를 "그리는" 쪽</text>
    `),

    /* ─── D4 파일시스템 ─── */
    vfs: svg(`
      ${lbl(40, 40, 'FILE SYSTEM · open( ) 한 번의 경로')}
      <rect x="56" y="80" width="150" height="50" rx="5" fill="${C.pan2}" stroke="${C.cyanD}"/>
      <text x="131" y="110" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${C.cyan}">open("a.txt")</text>
      ${arrowR(206, 105, 250, C.cyan)}
      <rect x="252" y="80" width="110" height="50" rx="5" fill="${C.pan2}" stroke="${C.ln2}"/>
      <text x="307" y="100" text-anchor="middle" font-family="monospace" font-size="8.5" fill="${C.dim}">경로 탐색</text>
      <text x="307" y="118" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">/home/a.txt</text>
      ${arrowR(362, 105, 406, C.cyan)}
      <rect x="408" y="72" width="140" height="76" rx="6" fill="#221a2e" stroke="${C.vio}"/>
      <text x="478" y="96" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${C.vio}">inode #482</text>
      <text x="478" y="114" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.dim}">크기 4KB · rw-r--r--</text>
      <text x="478" y="132" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.dim}">블록: 17, 18, 92</text>
      <path d="M478 148 V190" stroke="${C.ln2}" stroke-width="1.5"/>
      ${[['17',410],['18',458],['92',506]].map(([b,x]) => `
        <rect x="${x}" y="194" width="42" height="34" rx="3" fill="${C.pan}" stroke="${C.grn}"/>
        <text x="${x+21}" y="216" text-anchor="middle" font-family="monospace" font-size="8.5" fill="${C.grn}">B${b}</text>`).join('')}
      <text x="478" y="252" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">디스크 블록 (실제 내용)</text>
      <path d="M131 130 V190" stroke="${C.cyanD}" stroke-width="1.5"/>
      <rect x="76" y="194" width="110" height="40" rx="5" fill="${C.pan2}" stroke="${C.cyan}"/>
      <text x="131" y="219" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.cyan}">번호표: fd 3</text>
      <text x="131" y="256" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">이후 read(3, …)로</text>
      <rect x="60" y="296" width="480" height="60" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
      <text x="300" y="320" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.dim}">"모든 것은 파일" — 키보드도 화면도 소켓도 같은 read/write로</text>
      <text x="300" y="340" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">fd 0=키보드(stdin) · fd 1=화면(stdout) · fd 2=에러(stderr)</text>
      ${flow('M56 105 H548', C.cyan, 2, 3.4, 2)}
    `),

    /* ─── D4 드라이버 ─── */
    driver: svg(`
      ${lbl(40, 40, 'DEVICE DRIVER · 통역의 층계')}
      <rect x="100" y="70" width="400" height="54" rx="6" fill="#100b18" stroke="${C.vio}"/>
      <text x="300" y="102" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.vio}">커널: "블록 17을 읽어줘"</text>
      ${flow('M300 124 V160', C.vio, 1, 1.4, 2.5)}
      <rect x="100" y="162" width="400" height="62" rx="6" fill="${C.pan2}" stroke="${C.cyan}"/>
      <text x="300" y="188" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.cyan}">드라이버: 번역 중…</text>
      <text x="300" y="208" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">"컨트롤러 레지스터에 LBA=17, COUNT=1, CMD=READ를 써라"</text>
      ${flow('M300 224 V258', C.cyan, 1, 1.4, 2.5)}
      <rect x="100" y="260" width="400" height="50" rx="6" fill="${C.pan2}" stroke="${C.ln2}"/>
      <text x="300" y="282" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.dim}">장치 레지스터 (MMIO — 메모리처럼 보이는 주소에 쓰기)</text>
      <text x="300" y="300" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">1편 주소 버스에서 본 "메모리 맵 I/O"가 바로 이것</text>
      ${hot('irqhandler', '일이 끝나면 — 벨이 울린다',
        `<rect class="hot__shape" x="150" y="330" width="300" height="56" rx="6" fill="#1a1426" stroke="${C.warn}" stroke-width="1.5"/>
         <text x="300" y="354" text-anchor="middle" font-family="monospace" font-size="11" fill="${C.warn}">⚡ 인터럽트 발생!</text>
         <text x="300" y="372" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">"다 읽었어요" — 장치가 CPU를 부른다</text>`,
        300, 410, 'middle')}
    `),

    /* ─── D5 인터럽트 핸들러 ─── */
    irqhandler: svg(`
      ${lbl(40, 40, 'INTERRUPT HANDLER · 벨이 울린 다음')}
      <path d="M60 110 H540" stroke="${C.cyanD}" stroke-width="3"/>
      <text x="70" y="96" font-family="monospace" font-size="8.5" fill="${C.cyan}">프로세스 P1 실행 중…</text>
      <circle cx="230" cy="110" r="11" fill="#1a1426" stroke="${C.warn}" stroke-width="2"/>
      <text x="230" y="115" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.warn}">⚡</text>
      <text x="230" y="88" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.warn}">벨!</text>
      <path d="M230 121 V160" stroke="${C.warn}" stroke-width="1.5" stroke-dasharray="3 3"/>
      ${[['① 일터 저장', '레지스터·PC를 안전한 곳에', C.cyan], ['② 핸들러 실행', '짧게! 급한 최소한만', C.vio], ['③ 뒷일은 예약', '나머지는 softirq로 미룸', C.dim], ['④ 일터 복원', '저장해둔 그 자리로', C.grn]].map(([t, d, col], i) => `
        <rect x="${66 + i * 122}" y="164" width="106" height="76" rx="6" fill="${C.pan2}" stroke="${col}"/>
        <text x="${119 + i * 122}" y="192" text-anchor="middle" font-family="monospace" font-size="8.5" fill="${col}">${t}</text>
        <text x="${119 + i * 122}" y="216" text-anchor="middle" font-family="monospace" font-size="7.5" fill="${C.fnt}">${d}</text>
        ${i < 3 ? `<path d="M${172 + i * 122} 202 H${188 + i * 122}" stroke="${C.ln2}" stroke-width="1.5"/>` : ''}`).join('')}
      ${flow('M70 202 H530', C.warn, 2, 2.8, 2)}
      <path d="M530 240 Q540 270 460 274 H300" fill="none" stroke="${C.grn}" stroke-width="1.5" stroke-dasharray="4 3"/>
      <path d="M300 274 Q200 274 230 121" fill="none" stroke="${C.grn}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".5"/>
      <text x="300" y="296" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.grn}">P1은 아무것도 모른 채 이어 달린다 (1초에 수천 번)</text>
      ${hot('hwboundary', '이 벨은 어디서 오나',
        `<rect class="hot__shape" x="170" y="324" width="260" height="56" rx="6" fill="${C.pan}" stroke="${C.cyanD}" stroke-width="1.5"/>
         <text x="300" y="348" text-anchor="middle" font-family="monospace" font-size="10" fill="${C.cyan}">⏚ 하드웨어 경계로</text>
         <text x="300" y="366" text-anchor="middle" font-family="monospace" font-size="8" fill="${C.fnt}">소프트웨어의 바닥까지</text>`,
        300, 404, 'middle')}
    `),

    /* ─── D6 하드웨어 경계 (종착) ─── */
    hwboundary: svg(`
      ${lbl(40, 40, 'THE HARDWARE BOUNDARY · 소프트웨어의 바닥')}
      <rect x="60" y="64" width="480" height="130" rx="8" fill="#100b18" stroke="${C.vio}"/>
      <text x="300" y="90" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${C.vio}">커널의 마지막 문장들</text>
      ${[['MMIO 쓰기', '드라이버 → 장치 레지스터'], ['페이지 테이블', '커널이 그리고 MMU가 읽고'], ['IRQ 라인', '타이머 칩 → CPU']].map(([t, d], i) => `
        <rect x="${80 + i * 152}" y="108" width="136" height="66" rx="5" fill="${C.pan2}" stroke="${C.ln2}"/>
        <text x="${148 + i * 152}" y="134" text-anchor="middle" font-family="monospace" font-size="8.5" fill="${C.cyan}">${t}</text>
        <text x="${148 + i * 152}" y="156" text-anchor="middle" font-family="monospace" font-size="7.5" fill="${C.fnt}">${d}</text>`).join('')}
      <!-- 경계선 -->
      <line x1="40" y1="226" x2="560" y2="226" stroke="${C.vio}" stroke-width="2" stroke-dasharray="8 6"/>
      <text x="300" y="216" text-anchor="middle" font-family="monospace" font-size="9" fill="${C.vio}">— 여기까지가 소프트웨어 —</text>
      ${flow('M120 194 V250 M300 194 V250 M480 194 V250', C.cyan, 3, 2.2, 2.5)}
      <rect x="60" y="256" width="480" height="110" rx="8" fill="${C.pan}" stroke="${C.cyanD}"/>
      <text x="300" y="282" text-anchor="middle" font-family="monospace" font-size="9.5" fill="${C.cyan}">전기의 세계 (1편 「기계 속으로」)</text>
      ${[['버스·신호', 100], ['CPU·게이트', 230], ['트랜지스터', 360], ['원자·전자', 472]].map(([t, x]) => `
        <rect x="${x - 36}" y="300" width="${t.length > 5 ? 96 : 86}" height="40" rx="5" fill="${C.pan2}" stroke="${C.ln2}"/>
        <text x="${x + (t.length > 5 ? 12 : 7)}" y="325" text-anchor="middle" font-family="monospace" font-size="8.5" fill="${C.dim}">${t}</text>`).join('')}
      <text x="300" y="396" text-anchor="middle" class="s-label" fill="${C.fnt}">운영체제란 — 전기 위에 세운 질서. 그 전기의 이야기는 1편에서. ⦿</text>
    `),
  };

  window.SCENES = SCENES;
})();
