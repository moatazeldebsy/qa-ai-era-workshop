// Self-learner helpers for the course site. No backend: progress lives in this
// browser's localStorage, so it is per device and can be cleared. Everything
// degrades to plain content when storage or JavaScript is unavailable.
//
//   - "Mark this page as done" on every topic page
//   - progress summaries: <div class="topic-progress" data-topic="01">
//   - quizzes:           <div class="quiz" data-quiz="01" markdown> … task lists … </div>
//   - reset button:      <button data-course-reset>
(function () {
  const PREFIX = 'qa-deep-dive:';
  const PAGES = ['overview', 'concepts', 'lab', 'quiz'];
  const LABELS = { overview: 'Overview', concepts: 'Concepts', lab: 'Lab', quiz: 'Quiz' };

  const store = {
    get(key) {
      try {
        return window.localStorage.getItem(PREFIX + key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(PREFIX + key, value);
      } catch {
        /* private mode or blocked storage: progress just isn't remembered */
      }
    },
    clear() {
      try {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith(PREFIX))
          .forEach((k) => window.localStorage.removeItem(k));
      } catch {
        /* nothing to clear */
      }
    },
  };

  // /…/topics/03-unit-component/lab/ → { topic: '03', page: 'lab' }
  function currentPage() {
    const m = window.location.pathname.match(/\/topics\/(\d\d)-[^/]+\/(?:(concepts|lab|quiz)\/)?(?:index\.html)?$/);
    return m ? { topic: m[1], page: m[2] || 'overview' } : null;
  }

  const isDone = (topic, page) => store.get(`done:${topic}:${page}`) === '1';
  const quizBest = (topic) => store.get(`quiz:${topic}`);

  function markDoneButton(where) {
    const article = document.querySelector('.md-content__inner');
    if (!article) return;
    const box = document.createElement('div');
    box.className = 'course-done';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'md-button';
    const render = () => {
      const done = isDone(where.topic, where.page);
      button.textContent = done ? '✔ Done — click to undo' : `Mark “${LABELS[where.page]}” as done`;
      button.classList.toggle('md-button--primary', !done);
      button.setAttribute('aria-pressed', String(done));
    };
    button.addEventListener('click', () => {
      store.set(`done:${where.topic}:${where.page}`, isDone(where.topic, where.page) ? '0' : '1');
      render();
      renderProgress();
    });
    render();
    box.append(button);
    article.append(box);
  }

  function renderProgress() {
    document.querySelectorAll('[data-topic].topic-progress, [data-topic].topic-progress-mini').forEach((el) => {
      const topic = el.dataset.topic;
      const done = PAGES.filter((p) => isDone(topic, p)).length;
      const best = quizBest(topic);
      const pct = Math.round((done / PAGES.length) * 100);
      if (el.classList.contains('topic-progress-mini')) {
        el.textContent = done ? `${done}/${PAGES.length}${done === PAGES.length ? ' ✔' : ''}` : '—';
        return;
      }
      el.replaceChildren();
      const bar = document.createElement('div');
      bar.className = 'topic-progress__bar';
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuenow', String(pct));
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-label', 'Pages done in this topic');
      const fill = document.createElement('span');
      fill.style.width = `${pct}%`;
      bar.append(fill);
      const text = document.createElement('p');
      text.className = 'topic-progress__text';
      text.textContent =
        `Your progress: ${done}/${PAGES.length} pages done` +
        (best ? ` · best quiz score ${best}` : '') +
        ' · ' +
        PAGES.map((p) => `${isDone(topic, p) ? '✔' : '○'} ${LABELS[p]}`).join('  ');
      el.append(bar, text);
    });
  }

  function initQuiz(quiz) {
    if (quiz.dataset.ready) return;
    quiz.dataset.ready = '1';
    const id = quiz.dataset.quiz;
    const questions = [...quiz.querySelectorAll('.quiz-q')];
    const score = document.createElement('div');
    score.className = 'quiz-score';
    score.setAttribute('aria-live', 'polite');
    let answered = 0;
    let correct = 0;

    const update = () => {
      score.textContent = `Score: ${correct}/${answered} answered · ${questions.length - answered} to go`;
      if (answered < questions.length) return;
      const result = `${correct}/${questions.length}`;
      const prev = quizBest(id);
      if (!prev || Number(prev.split('/')[0]) < correct) store.set(`quiz:${id}`, result);
      score.textContent = `Final score: ${result}. ${correct === questions.length ? 'Excellent!' : 'Reread the explanations for the ones you missed.'}`;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'md-button';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => window.location.reload());
      score.append(' ', retry);
      renderProgress();
    };

    questions.forEach((q) => {
      const why = q.querySelector('.quiz-why');
      if (why) why.hidden = true;
      const items = [...q.querySelectorAll('li.task-list-item')];
      // Shuffle so the right answer's position carries no information.
      const list = items[0]?.parentElement;
      if (list) [...items].sort(() => Math.random() - 0.5).forEach((li) => list.append(li));
      items.forEach((li) => {
        const box = li.querySelector('input[type="checkbox"]');
        li.dataset.right = box && box.checked ? '1' : '0';
        li.querySelector('.task-list-control')?.remove();
        box?.remove();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option';
        button.append(...li.childNodes);
        li.append(button);
        button.addEventListener('click', () => {
          if (q.dataset.answered) return;
          q.dataset.answered = '1';
          answered += 1;
          if (li.dataset.right === '1') correct += 1;
          li.classList.add(li.dataset.right === '1' ? 'quiz-right' : 'quiz-wrong');
          items.forEach((other) => {
            if (other.dataset.right === '1') other.classList.add('quiz-right');
            other.querySelector('button').disabled = true;
          });
          if (why) why.hidden = false;
          update();
        });
      });
    });
    quiz.append(score);
    update();
  }

  function init() {
    const where = currentPage();
    if (where) markDoneButton(where);
    document.querySelectorAll('.quiz[data-quiz]').forEach(initQuiz);
    document.querySelectorAll('[data-course-reset]').forEach((b) =>
      b.addEventListener('click', () => {
        if (window.confirm('Clear your progress and quiz scores on this device?')) {
          store.clear();
          renderProgress();
        }
      }),
    );
    renderProgress();
  }

  // Material's instant navigation exposes document$; plain page loads don't.
  if (window.document$ && typeof window.document$.subscribe === 'function') window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
