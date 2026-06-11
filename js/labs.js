/* ============================================================
   labs.js — 커널 속으로: 인라인 미니랩 (2편 콘텐츠팩)
   v1: strace — write("안녕") 한 번의 여정
   ============================================================ */

const LABS = {

  /* ── 경쟁 상태: 슬로모션으로 증발을 목격 + 전속력 피해 확인 ── */
  racelab(el) {
    const SLOW = [
      { t1: '—', t2: '—', mem: 5, cap: '초기 상태 — count = 5. 두 스레드가 각자 count++를 실행하려 합니다.' },
      { t1: '읽기 → r=5', t2: '—', mem: 5, cap: 'T1이 count를 읽어 레지스터에 담음 (r₁=5)' },
      { t1: '읽기 → r=5', t2: '읽기 → r=5', mem: 5, cap: '⚡ 스케줄러가 끼어듦! T2도 count를 읽음 (r₂=5) — 같은 5를!' },
      { t1: '읽기 → r=5', t2: '+1 → r=6', mem: 5, cap: 'T2가 자기 레지스터에서 증가 (r₂=6)' },
      { t1: '읽기 → r=5', t2: '쓰기 6 ✓', mem: 6, cap: 'T2가 6을 메모리에 씀 — count = 6' },
      { t1: '+1 → r=6', t2: '완료', mem: 6, cap: 'T1로 복귀. 그러나 T1의 레지스터엔 여전히 옛날 값 5 → +1하면 6' },
      { t1: '쓰기 6 ⚠', t2: '완료', mem: 6, cap: '⚠ T1이 6을 덮어씀 — <b>두 번 더했는데 count=6!</b> 증가 하나가 증발했습니다.' },
    ];
    let mode = 'slow', si = -1, timer = null;

    el.innerHTML = `
      <div class="lab lab--race2">
        <div class="lab__tabs">
          <button class="lab__tab lab__tab--on" data-m="slow">슬로모션</button>
          <button class="lab__tab" data-m="fast">전속력 (×1000)</button>
        </div>
        <div class="cc-view">
          <div class="cc-row"><span class="cc-name" style="color:#56d6cf">T1</span><b class="cc-st" data-c="t1">—</b></div>
          <div class="cc-mem">count = <b data-c="mem">5</b></div>
          <div class="cc-row"><span class="cc-name" style="color:#b08ae0">T2</span><b class="cc-st" data-c="t2">—</b></div>
        </div>
        <button class="st-next cc-btn">▸ 다음 박자</button>
        <p class="lab__caption">한 박자씩 — 증발의 순간을 목격하세요.</p>
      </div>`;

    const tabs = el.querySelectorAll('.lab__tab');
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    const C = (k) => el.querySelector(`[data-c="${k}"]`);

    function paintSlow() {
      const s = si < 0 ? SLOW[0] : SLOW[si];
      C('t1').textContent = s.t1; C('t2').textContent = s.t2; C('mem').textContent = s.mem;
      C('mem').className = si === SLOW.length - 1 ? 'zero' : '';
      cap.innerHTML = si < 0 ? '한 박자씩 — 증발의 순간을 목격하세요.' : s.cap;
      btn.textContent = si >= SLOW.length - 1 ? '↻ 처음부터' : '▸ 다음 박자';
    }
    function runFast() {
      if (timer) clearInterval(timer);
      let done = 0, count = 0;
      const lostRate = 0.12 + Math.random() * 0.25;
      btn.textContent = '경주 중…'; btn.disabled = true;
      timer = setInterval(() => {
        if (!el.isConnected) { clearInterval(timer); return; }
        done += 50;
        count = Math.round(done * 2 * (1 - lostRate * (done / 1000)));
        C('t1').textContent = `++ ×${Math.min(done, 1000)}`;
        C('t2').textContent = `++ ×${Math.min(done, 1000)}`;
        C('mem').textContent = count;
        if (done >= 1000) {
          clearInterval(timer); timer = null; btn.disabled = false; btn.textContent = '▸ 다시 경주';
          const lost = 2000 - count;
          C('mem').className = 'zero';
          cap.innerHTML = `기대값 <b>2000</b>, 실제 <b class="zero">${count}</b> — <b>${lost}개 증발!</b> 실행할 때마다 다른 값이 나옵니다(비결정성).`;
        }
      }, 60);
    }
    tabs.forEach(t => t.addEventListener('click', () => {
      mode = t.dataset.m; si = -1;
      if (timer) { clearInterval(timer); timer = null; }
      tabs.forEach(x => x.classList.toggle('lab__tab--on', x === t));
      btn.disabled = false;
      if (mode === 'slow') { btn.textContent = '▸ 다음 박자'; paintSlow(); }
      else { btn.textContent = '▸ 경주 시작'; C('t1').textContent = '준비'; C('t2').textContent = '준비'; C('mem').textContent = '0'; C('mem').className = ''; cap.innerHTML = '두 스레드가 각자 count++를 1000번씩 — 결과는 2000일까요?'; }
    }));
    btn.addEventListener('click', () => {
      if (mode === 'slow') { si = si >= SLOW.length - 1 ? -1 : si + 1; paintSlow(); }
      else runFast();
    });
    paintSlow();
  },

  /* ── 락: 같은 상황, 이번엔 문고리를 걸고 ── */
  locklab(el) {
    const STEPS = [
      { t1: '락 획득 🔒', t2: '—', mem: 5, cap: 'T1이 문고리를 겁니다 — 이제 임계 구역은 T1만의 것.' },
      { t1: '읽기 → r=5', t2: '락 시도… 대기', mem: 5, cap: 'T2도 들어오려 하지만 — <b>문 앞에서 대기</b>. 끼어들 수 없습니다!' },
      { t1: '+1 → r=6', t2: '대기 zzz', mem: 5, cap: 'T1은 안전하게 증가. T2는 여전히 문 밖.' },
      { t1: '쓰기 6 ✓', t2: '대기 zzz', mem: 6, cap: 'T1이 6을 씀 — 임계 구역 작업 완료.' },
      { t1: '락 해제 🔓', t2: '락 획득 🔒', mem: 6, cap: 'T1이 문을 열자마자 T2가 입장 — 이제 T2의 차례.' },
      { t1: '완료', t2: '읽기 → r=6', mem: 6, cap: 'T2가 읽는 값은 <b>최신값 6</b> — 낡은 5가 아닙니다!' },
      { t1: '완료', t2: '쓰기 7 ✓', mem: 7, cap: '<b>count = 7 ✓</b> 두 번 더해 정확히 +2. 증발 없음 — 이것이 상호 배제의 힘.' },
    ];
    let si = -1;
    el.innerHTML = `
      <div class="lab lab--lock2">
        <div class="cc-view">
          <div class="cc-row"><span class="cc-name" style="color:#56d6cf">T1</span><b class="cc-st" data-c="t1">—</b></div>
          <div class="cc-mem">🔒 count = <b data-c="mem">5</b></div>
          <div class="cc-row"><span class="cc-name" style="color:#b08ae0">T2</span><b class="cc-st" data-c="t2">—</b></div>
        </div>
        <button class="st-next cc-btn">▸ 다음 박자</button>
        <p class="lab__caption">경쟁 상태의 그 상황 — 이번엔 락을 걸고 다시.</p>
      </div>`;
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    const C = (k) => el.querySelector(`[data-c="${k}"]`);
    btn.addEventListener('click', () => {
      si = si >= STEPS.length - 1 ? -1 : si + 1;
      const s = si < 0 ? { t1: '—', t2: '—', mem: 5 } : STEPS[si];
      C('t1').textContent = s.t1; C('t2').textContent = s.t2; C('mem').textContent = s.mem;
      C('mem').className = si === STEPS.length - 1 ? 'one' : '';
      cap.innerHTML = si < 0 ? '경쟁 상태의 그 상황 — 이번엔 락을 걸고 다시.' : s.cap;
      btn.textContent = si >= STEPS.length - 1 ? '↻ 처음부터' : '▸ 다음 박자';
    });
  },

  /* ── 데드락: 락 잡는 순서를 골라 직접 멈춰보기 ── */
  deadlock(el) {
    const SAME = [
      { t1: 'A 획득 🔒', t2: 'A 시도… 대기', a: 'T1', b: '—', cap: '둘 다 A부터 — T1이 먼저 잡고, T2는 줄을 섭니다.' },
      { t1: 'B 획득 🔒', t2: '대기 zzz', a: 'T1', b: 'T1', cap: 'T1이 B도 획득 — 막힘 없음. T2는 얌전히 대기.' },
      { t1: '작업 → 해제 🔓🔓', t2: 'A 획득 🔒', a: 'T2', b: '—', cap: 'T1 완료·해제 → 기다리던 T2가 A 획득.' },
      { t1: '완료 ✓', t2: 'B 획득 → 작업 ✓', a: 'T2', b: 'T2', cap: '<b>둘 다 완료 ✓</b> — 같은 순서로 잡으면 줄은 생겨도 고리는 안 생깁니다.' },
    ];
    const OPP = [
      { t1: 'A 획득 🔒', t2: 'B 획득 🔒', a: 'T1', b: 'T2', cap: 'T1은 A부터, T2는 B부터 — 각자 하나씩 쥐었습니다. 아직은 평화롭죠.' },
      { t1: 'B 시도… 대기', t2: '—', a: 'T1', b: 'T2', cap: 'T1이 B를 원하지만 — B는 T2의 손에. T1 대기.' },
      { t1: '대기…', t2: 'A 시도… 대기', a: 'T1', b: 'T2', cap: 'T2도 A를 원하지만 — A는 T1의 손에. <b>고리가 닫혔습니다.</b>' },
      { t1: '💀 영원히 대기', t2: '💀 영원히 대기', a: 'T1', b: 'T2', cap: '<b>데드락!</b> 에러도 없이, 조용히, 영원히. — 해법: 둘 다 A→B 순서로 잡았다면?' },
    ];
    let seq = null, si = -1;
    el.innerHTML = `
      <div class="lab lab--dl">
        <div class="lab__tabs">
          <button class="lab__tab" data-o="same">같은 순서 (둘 다 A→B)</button>
          <button class="lab__tab" data-o="opp">반대 순서 (A→B vs B→A)</button>
        </div>
        <div class="cc-view">
          <div class="cc-row"><span class="cc-name" style="color:#56d6cf">T1</span><b class="cc-st" data-c="t1">—</b></div>
          <div class="dl-locks">
            <span class="dl-lock">락 A: <b data-c="a">—</b></span>
            <span class="dl-lock">락 B: <b data-c="b">—</b></span>
          </div>
          <div class="cc-row"><span class="cc-name" style="color:#b08ae0">T2</span><b class="cc-st" data-c="t2">—</b></div>
        </div>
        <button class="st-next cc-btn" disabled>▸ 다음 박자</button>
        <p class="lab__caption">먼저 시나리오를 고르세요 — 락 잡는 순서가 운명을 가릅니다.</p>
      </div>`;
    const tabs = el.querySelectorAll('.lab__tab');
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    const C = (k) => el.querySelector(`[data-c="${k}"]`);
    function paint() {
      const s = si < 0 ? { t1: '—', t2: '—', a: '—', b: '—' } : seq[si];
      C('t1').textContent = s.t1; C('t2').textContent = s.t2;
      C('a').textContent = s.a; C('b').textContent = s.b;
      const dead = seq === OPP && si === seq.length - 1;
      C('t1').className = 'cc-st' + (dead ? ' zero' : ''); C('t2').className = 'cc-st' + (dead ? ' zero' : '');
      if (si >= 0) cap.innerHTML = seq[si].cap;
      btn.textContent = si >= seq.length - 1 ? '↻ 처음부터' : '▸ 다음 박자';
    }
    tabs.forEach(t => t.addEventListener('click', () => {
      seq = t.dataset.o === 'same' ? SAME : OPP; si = -1;
      tabs.forEach(x => x.classList.toggle('lab__tab--on', x === t));
      btn.disabled = false; btn.textContent = '▸ 다음 박자';
      C('t1').textContent = '—'; C('t2').textContent = '—'; C('a').textContent = '—'; C('b').textContent = '—';
      cap.innerHTML = t.dataset.o === 'same' ? '둘 다 A부터 잡습니다 — 진행해 보세요.' : 'T1은 A부터, T2는 B부터 — 진행해 보세요.';
    }));
    btn.addEventListener('click', () => { si = si >= seq.length - 1 ? -1 : si + 1; paint(); });
  },

  /* ── fork: 분신술 한 번의 드라마 ── */
  forklab(el) {
    const STEPS = [
      { p: 'fork() 호출!', c: '— (아직 없음)', cap: '부모(PID 100)가 분신술을 시전합니다.' },
      { p: 'fork → 101 반환', c: '✦ 탄생! fork → 0 반환', cap: '커널이 복제(CoW — 지도만!). <b>같은 코드의 다음 줄</b>에서 둘 다 깨어나는데 — 부모는 자식 PID(101)를, 자식은 0을 받습니다. 반환값 하나로 "내가 본체인가 분신인가"를 압니다.' },
      { p: 'wait(101) — 대기', c: 'exec("game") — 변신!', cap: '자식이 exec로 몸(코드·데이터)을 game으로 통째 교체 — PID는 그대로. 부모는 wait로 자식의 끝을 기다립니다.' },
      { p: '대기 zzz', c: 'game 실행 중…', cap: '복제(fork)와 변신(exec)을 분리한 덕에 — 그 사이에 파이프 연결, 권한 낮추기 같은 준비를 끼울 수 있습니다. 유닉스 설계의 묘미.' },
      { p: '대기 zzz', c: 'exit(0) → 💀 좀비', cap: '자식이 종료 — 하지만 즉시 소멸하지 않습니다. <b>종료 코드를 품은 좀비</b>로 남아 부모의 수거를 기다립니다.' },
      { p: 'wait → 0 수거 ✓', c: '(소멸)', cap: '부모가 종료 코드를 수거하는 순간 좀비가 사라집니다. 부모가 wait를 안 하면? — 좀비가 쌓입니다. 부모가 먼저 죽으면? — init(PID 1)이 고아를 입양해 대신 수거합니다.' },
    ];
    let si = -1;
    el.innerHTML = `
      <div class="lab lab--fork">
        <div class="cc-view">
          <div class="cc-row"><span class="cc-name" style="color:#56d6cf">부모<br>100</span><b class="cc-st" data-c="p">—</b></div>
          <div class="cc-row"><span class="cc-name" style="color:#b08ae0">자식<br>101</span><b class="cc-st" data-c="c">—</b></div>
        </div>
        <button class="st-next cc-btn">▸ 다음 장면</button>
        <p class="lab__caption">fork 한 번의 드라마 — 탄생부터 수거까지.</p>
      </div>`;
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    const C = (k) => el.querySelector(`[data-c="${k}"]`);
    btn.addEventListener('click', () => {
      si = si >= STEPS.length - 1 ? -1 : si + 1;
      const s = si < 0 ? { p: '—', c: '—' } : STEPS[si];
      C('p').textContent = s.p; C('c').textContent = s.c;
      cap.innerHTML = si < 0 ? 'fork 한 번의 드라마 — 탄생부터 수거까지.' : s.cap;
      btn.textContent = si >= STEPS.length - 1 ? '↻ 처음부터' : '▸ 다음 장면';
    });
  },

  /* ── 교체 정책 대결: 같은 접근 순서, FIFO vs LRU ── */
  policylab(el) {
    const REF = [1, 2, 3, 1, 2, 4, 1, 2, 5, 3];
    const NF = 3;
    function simulate(alg) {
      const steps = []; const frames = []; const meta = []; let faults = 0;
      REF.forEach((p, t) => {
        let fault = false, evicted = null;
        const idx = frames.indexOf(p);
        if (idx === -1) {
          fault = true; faults++;
          if (frames.length < NF) { frames.push(p); meta.push(t); }
          else {
            let vi = 0;
            if (alg === 'FIFO') vi = meta.indexOf(Math.min(...meta));
            else vi = meta.indexOf(Math.min(...meta)); // LRU: meta=마지막 사용 시각
            evicted = frames[vi]; frames[vi] = p; meta[vi] = t;
          }
        } else if (alg === 'LRU') meta[idx] = t;
        steps.push({ ref: p, frames: frames.slice(), fault, evicted, faults });
      });
      return steps;
    }
    const TOTAL = { FIFO: simulate('FIFO').at(-1).faults, LRU: simulate('LRU').at(-1).faults };
    let alg = null, steps = null, si = -1;

    el.innerHTML = `
      <div class="lab lab--policy">
        <div class="lab__tabs">
          <button class="lab__tab" data-a="FIFO">FIFO로 돌리기</button>
          <button class="lab__tab" data-a="LRU">LRU로 돌리기</button>
        </div>
        <div class="pol-ref">${REF.map((p, i) => `<span class="pol-r" data-r="${i}">${p}</span>`).join('')}</div>
        <div class="pol-frames">${Array.from({ length: NF }, (_, i) => `<span class="pol-f" data-f="${i}">·</span>`).join('')}</div>
        <div class="cc-mem">폴트 <b data-c="faults">0</b> 회</div>
        <button class="st-next cc-btn" disabled>▸ 다음 접근</button>
        <p class="lab__caption">정책을 고르고, 페이지 접근 순서(위 띠)를 한 칸씩 진행해 보세요. 프레임은 3칸!</p>
      </div>`;
    const tabs = el.querySelectorAll('.lab__tab');
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    const C = (k) => el.querySelector(`[data-c="${k}"]`);
    function paint() {
      el.querySelectorAll('.pol-r').forEach((r, i) => {
        r.classList.toggle('pol-r--on', i === si);
        r.classList.toggle('pol-r--done', i < si);
      });
      const s = si < 0 ? { frames: [], faults: 0 } : steps[si];
      el.querySelectorAll('.pol-f').forEach((f, i) => {
        f.textContent = s.frames[i] != null ? s.frames[i] : '·';
        f.classList.toggle('pol-f--new', si >= 0 && s.fault && s.frames[i] === steps[si].ref);
      });
      C('faults').textContent = s.faults;
      if (si < 0) return;
      if (si >= steps.length - 1) {
        const other = alg === 'FIFO' ? 'LRU' : 'FIFO';
        cap.innerHTML = `<b>${alg} 최종: 폴트 ${s.faults}회</b> — 참고로 ${other}는 ${TOTAL[other]}회. ` +
          (TOTAL[alg] <= TOTAL[other] ? '이번 순서에선 이쪽이 승!' : `${other}가 더 적습니다 — 직접 돌려 확인해 보세요.`);
        btn.textContent = '↻ 처음부터';
      } else {
        cap.innerHTML = s.fault
          ? `페이지 <b>${steps[si].ref}</b> 접근 → <b class="zero">폴트!</b>` + (s.evicted ? ` ${s.evicted}를 추방하고 입주` : ' 빈 칸에 입주')
          : `페이지 <b>${steps[si].ref}</b> 접근 → <b class="one">적중</b> — 이미 RAM에` + (alg === 'LRU' ? ' (최근 사용 갱신!)' : '');
        btn.textContent = '▸ 다음 접근';
      }
    }
    tabs.forEach(t => t.addEventListener('click', () => {
      alg = t.dataset.a; steps = simulate(alg); si = -1;
      tabs.forEach(x => x.classList.toggle('lab__tab--on', x === t));
      btn.disabled = false; btn.textContent = '▸ 다음 접근';
      cap.innerHTML = `<b>${alg}</b> 선택 — ${alg === 'FIFO' ? '들어온 지 가장 오래된 페이지를 추방' : '안 쓰인 지 가장 오래된 페이지를 추방'}. 진행하세요!`;
      paint();
    }));
    btn.addEventListener('click', () => { si = si >= steps.length - 1 ? -1 : si + 1; paint(); });
  },

  /* ── 파이프: 셸이 ls | grep 배관을 까는 법 ── */
  pipelab(el) {
    const STEPS = [
      { sh: 'pipe() 호출', c1: '—', c2: '—', cap: '셸이 커널에 관 하나를 부탁합니다 → 읽기끝(fd3)·쓰기끝(fd4) 번호표 두 장을 받습니다.' },
      { sh: 'fork() ×2', c1: '✦ 탄생 (관 상속)', c2: '✦ 탄생 (관 상속)', cap: '자식 둘을 만듭니다 — fork는 열린 파일을 물려주므로, 둘 다 관의 양끝을 쥐고 태어납니다.' },
      { sh: '대기', c1: '쓰기끝 → 내 stdout', c2: '—', cap: '자식1: dup2(fd4, 1) — "내 표준 출력은 이제 관이다". 화면 대신 관으로 쏟아지게 배선 변경.' },
      { sh: '대기', c1: 'exec("ls")', c2: '읽기끝 → 내 stdin', cap: '자식2: dup2(fd3, 0) — "내 표준 입력은 이제 관이다". 그리고 자식1은 ls로 변신.' },
      { sh: '대기', c1: 'ls 실행 → 관으로 출력', c2: 'exec("grep") → 관에서 읽기', cap: '<b>핵심</b>: ls도 grep도 그냥 fd1에 쓰고 fd0에서 읽을 뿐 — 관인지 화면인지 모릅니다. "모든 것은 파일"의 마법.' },
      { sh: 'wait ×2 → 완료 ✓', c1: '종료', c2: '종료', cap: '<b>ls | grep 완성.</b> 프로그램 한 줄 안 고치고 배관만 바꿔 연결 — fork/exec 분리 + 파일 추상화의 합작품입니다.' },
    ];
    let si = -1;
    el.innerHTML = `
      <div class="lab lab--pipe2">
        <div class="cc-view">
          <div class="cc-row"><span class="cc-name" style="color:#86e6a2">셸</span><b class="cc-st" data-c="sh">—</b></div>
          <div class="cc-row"><span class="cc-name" style="color:#56d6cf">자식1</span><b class="cc-st" data-c="c1">—</b></div>
          <div class="cc-row"><span class="cc-name" style="color:#b08ae0">자식2</span><b class="cc-st" data-c="c2">—</b></div>
        </div>
        <button class="st-next cc-btn">▸ 다음 장면</button>
        <p class="lab__caption">셸에 <b>ls | grep</b>을 친 순간 — 배관 공사를 따라가 보세요.</p>
      </div>`;
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    const C = (k) => el.querySelector(`[data-c="${k}"]`);
    btn.addEventListener('click', () => {
      si = si >= STEPS.length - 1 ? -1 : si + 1;
      const s = si < 0 ? { sh: '—', c1: '—', c2: '—' } : STEPS[si];
      C('sh').textContent = s.sh; C('c1').textContent = s.c1; C('c2').textContent = s.c2;
      cap.innerHTML = si < 0 ? '셸에 <b>ls | grep</b>을 친 순간 — 배관 공사를 따라가 보세요.' : s.cap;
      btn.textContent = si >= STEPS.length - 1 ? '↻ 처음부터' : '▸ 다음 장면';
    });
  },

  /* ── 간트 차트: FCFS vs SJF vs RR (공룡책 예제) ── */
  ganttlab(el) {
    const JOBS = [['P1', 24], ['P2', 3], ['P3', 3]]; // 버스트 시간
    const ALG = {
      FCFS: { seg: [['P1', 0, 24], ['P2', 24, 27], ['P3', 27, 30]], wait: { P1: 0, P2: 24, P3: 27 } },
      SJF: { seg: [['P2', 0, 3], ['P3', 3, 6], ['P1', 6, 30]], wait: { P1: 6, P2: 0, P3: 3 } },
      'RR(q=4)': { seg: [['P1', 0, 4], ['P2', 4, 7], ['P3', 7, 10], ['P1', 10, 30]], wait: { P1: 6, P2: 4, P3: 7 } },
    };
    const COL = { P1: '#56d6cf', P2: '#86e6a2', P3: '#b08ae0' };
    el.innerHTML = `
      <div class="lab lab--gantt">
        <p class="lab__caption" style="margin-top:0">작업: P1(24) · P2(3) · P3(3) — 같은 셋, 규칙만 바꿔서.</p>
        <div class="lab__tabs">${Object.keys(ALG).map(a => `<button class="lab__tab" data-g="${a}">${a}</button>`).join('')}</div>
        <div class="gnt-bar"></div>
        <div class="gnt-stats"></div>
        <p class="lab__caption gnt-cap">규칙을 골라 간트 차트를 비교해 보세요.</p>
      </div>`;
    const bar = el.querySelector('.gnt-bar');
    const stats = el.querySelector('.gnt-stats');
    const cap = el.querySelector('.gnt-cap');
    const tabs = el.querySelectorAll('.lab__tab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.toggle('lab__tab--on', x === t));
      const a = ALG[t.dataset.g];
      bar.innerHTML = a.seg.map(([p, s0, e]) =>
        `<span class="gnt-seg" style="flex:${e - s0};background:${COL[p]}22;border-color:${COL[p]};color:${COL[p]}">${p}<small>${e - s0}</small></span>`).join('');
      const w = a.wait, avg = ((w.P1 + w.P2 + w.P3) / 3).toFixed(1);
      stats.innerHTML = `대기: P1=${w.P1} · P2=${w.P2} · P3=${w.P3} → 평균 <b>${avg}</b>`;
      cap.innerHTML = t.dataset.g === 'FCFS'
        ? '긴 P1 뒤에 짧은 둘이 갇혔습니다(호송대 효과) — 평균 17.0'
        : t.dataset.g === 'SJF'
          ? '짧은 것 먼저 — 평균 3.0! (FCFS의 1/5) 단, 버스트 시간을 미리 알아야 한다는 함정'
          : '한 조각(4)씩 순환 — 평균 5.7. 최적은 아니지만 <b>모두가 금방 첫 응답</b>을 받습니다';
    }));
    tabs[0].click();
  },

  /* ── 식사하는 철학자: 전략을 골라 굶겨보기 ── */
  philolab(el) {
    const ALL_LEFT = [
      { st: ['생각', '생각', '생각', '생각', '생각'], fk: ['—', '—', '—', '—', '—'], cap: '철학자 5명이 배가 고파집니다 — 전원 왼쪽 포크부터 집기로 했습니다.' },
      { st: ['🍴L', '🍴L', '🍴L', '🍴L', '🍴L'], fk: ['P1', 'P2', 'P3', 'P4', 'P5'], cap: '동시에 전원이 왼쪽 포크를 집었습니다 — 포크 5개가 전부 한 손씩에.' },
      { st: ['오른쪽 대기', '오른쪽 대기', '오른쪽 대기', '오른쪽 대기', '오른쪽 대기'], fk: ['P1', 'P2', 'P3', 'P4', 'P5'], cap: '모두 오른쪽 포크를 기다립니다 — 그런데 그건 옆 사람의 왼손에…' },
      { st: ['💀 굶주림', '💀 굶주림', '💀 굶주림', '💀 굶주림', '💀 굶주림'], fk: ['P1', 'P2', 'P3', 'P4', 'P5'], cap: '<b>원형 대기 완성 — 전원 아사.</b> 아무도 양보하지 않고, 아무도 먹지 못합니다. 데드락의 가장 유명한 초상화.' },
    ];
    const ONE_FLIP = [
      { st: ['생각', '생각', '생각', '생각', '생각'], fk: ['—', '—', '—', '—', '—'], cap: '이번엔 P5만 <b>오른쪽부터</b> 집기로 합니다(비대칭) — 단 한 명의 규칙 변경.' },
      { st: ['🍴L', '🍴L', '🍴L', '🍴L', '대기'], fk: ['P1', 'P2', 'P3', 'P4', '—'], cap: 'P1~P4는 왼쪽을 집었지만, P5의 "오른쪽"(=포크1)은 P1의 손에 — P5 대기. 포크 5가 비었습니다!' },
      { st: ['🍴L', '🍴L', '🍴L', '🍽 식사!', '대기'], fk: ['P1', 'P2', 'P3', 'P4', 'P4'], cap: '비어 있던 포크 5를 P4가 집어 <b>식사 시작!</b> — 고리가 끊겼습니다.' },
      { st: ['🍽 식사!', '…', '…', '완료 → 반납', '🍴 차례 옴'], fk: ['P1', 'P2', 'P3', '—', 'P5'], cap: 'P4가 다 먹고 반납 → 이웃들이 차례차례 식사. <b>전원 굶지 않음 ✓</b> — 원형 대기 하나만 깨도 충분합니다.' },
    ];
    let seq = null, si = -1;
    el.innerHTML = `
      <div class="lab lab--philo">
        <div class="lab__tabs">
          <button class="lab__tab" data-p="left">전원 왼쪽부터</button>
          <button class="lab__tab" data-p="flip">한 명만 오른쪽부터</button>
        </div>
        <div class="cc-view">
          <div class="ph-row">${[1,2,3,4,5].map(i => `<span class="ph-cell" data-ph="${i-1}">P${i}<b>생각</b></span>`).join('')}</div>
          <div class="ph-row ph-row--fk">${[1,2,3,4,5].map(i => `<span class="ph-fk" data-fk="${i-1}">🍴${i}<b>—</b></span>`).join('')}</div>
        </div>
        <button class="st-next cc-btn" disabled>▸ 다음 장면</button>
        <p class="lab__caption">전략을 고르세요 — 단 한 명의 규칙이 전원의 운명을 가릅니다.</p>
      </div>`;
    const tabs = el.querySelectorAll('.lab__tab');
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    function paint() {
      const s = si < 0 ? { st: ['생각','생각','생각','생각','생각'], fk: ['—','—','—','—','—'] } : seq[si];
      el.querySelectorAll('.ph-cell').forEach((c, i) => {
        c.querySelector('b').textContent = s.st[i];
        c.classList.toggle('ph-dead', s.st[i].includes('💀'));
        c.classList.toggle('ph-eat', s.st[i].includes('🍽'));
      });
      el.querySelectorAll('.ph-fk').forEach((c, i) => { c.querySelector('b').textContent = s.fk[i]; });
      if (si >= 0) cap.innerHTML = seq[si].cap;
      btn.textContent = seq && si >= seq.length - 1 ? '↻ 처음부터' : '▸ 다음 장면';
    }
    tabs.forEach(t => t.addEventListener('click', () => {
      seq = t.dataset.p === 'left' ? ALL_LEFT : ONE_FLIP; si = -1;
      tabs.forEach(x => x.classList.toggle('lab__tab--on', x === t));
      btn.disabled = false; btn.textContent = '▸ 다음 장면';
      cap.innerHTML = t.dataset.p === 'left' ? '대칭의 함정 — 진행해 보세요.' : '비대칭의 지혜 — 진행해 보세요.';
      paint();
    }));
    btn.addEventListener('click', () => { si = si >= seq.length - 1 ? -1 : si + 1; paint(); });
  },

  /* ── 단편화: 할당·해제를 거듭하면 ── */
  fraglab(el) {
    const N = 20;
    const STEPS = [
      { mem: 'AAAAA...............', cap: 'A(5칸) 입주 — 아직 평화롭습니다.' },
      { mem: 'AAAAABBB............', cap: 'B(3칸) 입주.' },
      { mem: 'AAAAABBBCCCC........', cap: 'C(4칸) 입주.' },
      { mem: 'AAAAA...CCCC........', cap: 'B 퇴거 — 가운데 3칸 구멍이 생겼습니다.' },
      { mem: 'AAAAA...CCCCDDDDD...', cap: 'D(5칸)는 구멍(3칸)에 안 들어가 뒤로 — 구멍은 그대로 남습니다.' },
      { mem: '.....EEE on hold....', cap: '<b>E(6칸) 입주 실패!</b> 빈칸 합계 = 3+3+2 = 8칸인데, 연속 6칸이 없습니다 — <b>외부 단편화</b>. 페이징이 발명된 이유가 바로 이 장면입니다.', fail: true, prev: 'AAAAA...CCCCDDDDD...' },
    ];
    let si = -1;
    const COL = { A: '#56d6cf', B: '#86e6a2', C: '#b08ae0', D: '#e0916f' };
    el.innerHTML = `
      <div class="lab lab--frag">
        <div class="frag-bar">${Array.from({ length: N }, () => '<span class="frag-c"></span>').join('')}</div>
        <button class="st-next cc-btn">▸ 다음 사건</button>
        <p class="lab__caption">메모리 20칸 — 연속 할당의 삶을 지켜보세요.</p>
      </div>`;
    const cells = el.querySelectorAll('.frag-c');
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    btn.addEventListener('click', () => {
      si = si >= STEPS.length - 1 ? -1 : si + 1;
      const st = si < 0 ? { mem: '.'.repeat(N) } : STEPS[si];
      const mem = st.fail ? st.prev : st.mem;
      cells.forEach((c, i) => {
        const ch = mem[i];
        c.style.background = ch !== '.' && COL[ch] ? COL[ch] + '33' : 'transparent';
        c.style.borderColor = ch !== '.' && COL[ch] ? COL[ch] : 'var(--line)';
        c.textContent = ch !== '.' ? ch : '';
        c.classList.toggle('frag-fail', !!st.fail && ch === '.');
      });
      cap.innerHTML = si < 0 ? '메모리 20칸 — 연속 할당의 삶을 지켜보세요.' : st.cap;
      btn.textContent = si >= STEPS.length - 1 ? '↻ 처음부터' : '▸ 다음 사건';
    });
  },

  /* ── 디스크 스케줄링: FCFS vs SCAN 헤드 이동 ── */
  scanlab(el) {
    const START = 53;
    const FCFS = [98, 183, 37, 122, 14, 124, 65, 67];
    const SCAN = [37, 14, 0, 65, 67, 98, 122, 124, 183];
    let seq = null, si = -1, pos = START, total = 0;
    el.innerHTML = `
      <div class="lab lab--scan">
        <div class="lab__tabs">
          <button class="lab__tab" data-s="fcfs">FCFS (온 순서)</button>
          <button class="lab__tab" data-s="scan">SCAN (엘리베이터)</button>
        </div>
        <svg class="scan-svg" viewBox="0 0 240 56">
          <line x1="8" y1="28" x2="232" y2="28" stroke="#26384a" stroke-width="2"/>
          ${[14,37,65,67,98,122,124,183].map(t => `<circle cx="${8 + t / 199 * 224}" cy="28" r="2.5" fill="#2c7a78" data-t="${t}"/>`).join('')}
          <circle class="scan-head" cx="${8 + 53 / 199 * 224}" cy="28" r="6" fill="#b08ae0"/>
        </svg>
        <div class="cc-mem">이동 거리 <b data-c="tot">0</b> 트랙</div>
        <button class="st-next cc-btn" disabled>▸ 다음 요청</button>
        <p class="lab__caption">방식을 고르세요 — 헤드(보라)가 53에서 출발합니다.</p>
      </div>`;
    const tabs = el.querySelectorAll('.lab__tab');
    const head = el.querySelector('.scan-head');
    const tot = el.querySelector('[data-c="tot"]');
    const btn = el.querySelector('.cc-btn');
    const cap = el.querySelector('.lab__caption');
    head.style.transition = 'cx .5s';
    function reset() { si = -1; pos = START; total = 0; head.setAttribute('cx', 8 + START / 199 * 224); tot.textContent = '0'; }
    tabs.forEach(t => t.addEventListener('click', () => {
      seq = t.dataset.s === 'fcfs' ? FCFS : SCAN;
      tabs.forEach(x => x.classList.toggle('lab__tab--on', x === t));
      reset(); btn.disabled = false; btn.textContent = '▸ 다음 요청';
      cap.innerHTML = t.dataset.s === 'fcfs' ? '요청이 도착한 순서 그대로 — 진행해 보세요.' : '0 방향으로 쓸고 반환 — 진행해 보세요.';
    }));
    btn.addEventListener('click', () => {
      if (si >= seq.length - 1) { reset(); btn.textContent = '▸ 다음 요청'; cap.innerHTML = '다시 한 번!'; return; }
      si++;
      const next = seq[si];
      total += Math.abs(next - pos);
      cap.innerHTML = `${pos} → <b>${next}</b> (+${Math.abs(next - pos)})`;
      pos = next;
      head.setAttribute('cx', 8 + next / 199 * 224);
      tot.textContent = total;
      if (si >= seq.length - 1) {
        btn.textContent = '↻ 처음부터';
        const isF = seq === FCFS;
        cap.innerHTML = `완료 — 총 <b>${total} 트랙</b>. ` + (isF ? 'SCAN이라면 236 — 거의 1/3!' : 'FCFS였다면 640 — 엘리베이터의 승리.');
      }
    });
  },

  /* ── strace: 시스템 콜 한 번의 왕복을 한 단계씩 ── */
  strace(el) {
    const STEPS = [
      ['유저 코드', 'printf("안녕");  — 평범한 한 줄', 'u'],
      ['라이브러리', 'libc가 write(1, "안녕", 6)으로 변환', 'u'],
      ['트랩', 'syscall 명령 — Ring 3 → Ring 0, 문을 통과!', 'b'],
      ['커널 VFS', 'fd 1(stdout)의 정체를 확인 — 화면이군', 'k'],
      ['드라이버', '그래픽/터미널 드라이버가 글자를 출력', 'k'],
      ['복귀', '쓴 바이트 수(6)를 들고 Ring 3로 귀환', 'b'],
      ['유저 코드', 'printf가 6을 반환 — 아무 일 없었다는 듯', 'u'],
    ];
    const ZONE = { u: ['유저 공간', '#56d6cf'], b: ['경계 통과', '#b08ae0'], k: ['커널 공간', '#86e6a2'] };
    let i = -1;

    el.innerHTML = `
      <div class="lab lab--strace">
        <div class="st-zone"><span class="st-zone__dot"></span><span class="st-zone__name">시작 전</span></div>
        <div class="st-steps">${STEPS.map((s, j) => `<span class="st-step" data-s="${j}">${s[0]}</span>`).join('<span class="st-sep">→</span>')}</div>
        <button class="st-next">▸ 다음 단계</button>
        <p class="lab__caption">printf 한 줄이 다녀오는 왕복 여행 — 한 단계씩 따라가 보세요.</p>
      </div>`;

    const chips = el.querySelectorAll('.st-step');
    const btn = el.querySelector('.st-next');
    const cap = el.querySelector('.lab__caption');
    const zDot = el.querySelector('.st-zone__dot');
    const zName = el.querySelector('.st-zone__name');

    btn.addEventListener('click', () => {
      i = i >= STEPS.length - 1 ? 0 : i + 1;
      chips.forEach((c, j) => {
        c.classList.toggle('st-step--on', j === i);
        c.classList.toggle('st-step--done', j < i);
      });
      const [zone, col] = ZONE[STEPS[i][2]];
      zDot.style.background = col; zDot.style.boxShadow = `0 0 8px ${col}`;
      zName.textContent = zone; zName.style.color = col;
      btn.textContent = i >= STEPS.length - 1 ? '↻ 처음부터' : '▸ 다음 단계';
      cap.innerHTML = `<b>${STEPS[i][0]}</b> — ${STEPS[i][1]}`;
    });
  },
};
