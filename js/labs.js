/* ============================================================
   labs.js — 커널 속으로: 인라인 미니랩 (2편 콘텐츠팩)
   v1: strace — write("안녕") 한 번의 여정
   ============================================================ */

const LABS = {

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
