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
