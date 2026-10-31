(() => {
  const MAX_TRIES = 6;
  const SAMPLES = [
    {
      name: "Activity 1",
      words: [
        {
          word: "ARRAY",
          clues: [
            "An ordered list of values",
            "Created with square brackets in JavaScript",
            "Has a length property",
          ],
        },
        {
          word: "LOOP",
          clues: ["Repeats code", "for and while create one"],
        },
        {
          word: "CSS",
          clues: ["Styles a web page", "Stands for Cascading Style ___"],
        },
      ],
    },
  ];
  const $ = (id) => document.getElementById(id);

  let activities = load();
  let progress = {}; // progress[actIdx][wordIdx] = {guesses, over}
  let actIdx = 0,
    wIdx = 0,
    typed = "",
    busy = false;

  // create-tab state
  let draft = { name: "", words: [] };
  let editingAct = -1,
    editingWord = -1;

  /* ---------- storage ---------- */
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem("codle.activities"));
      if (Array.isArray(s) && s.length) return s;
    } catch (e) {}
    return JSON.parse(JSON.stringify(SAMPLES));
  }
  function save() {
    try {
      localStorage.setItem("codle.activities", JSON.stringify(activities));
    } catch (e) {}
  }

  /* ---------- tabs ---------- */
  function showTab(t) {
    $("play").classList.toggle("active", t === "play");
    $("make").classList.toggle("active", t === "make");
    $("navPlay").classList.toggle("active", t === "play");
    $("navMake").classList.toggle("active", t === "make");
  }
  $("navPlay").onclick = () => {
    showTab("play");
    renderSelect();
    openWord();
  };
  $("navMake").onclick = () => showTab("make");
  const playing = () => $("play").classList.contains("active");

  /* =========================================================
     PLAY
     ========================================================= */
  const typer = $("typer");

  function focusTyper() {
    if (!playing() || !curWord()) return;
    try {
      typer.focus({ preventScroll: true });
    } catch (e) {
      typer.focus();
    }
  }

  function renderSelect() {
    const sel = $("actSelect");
    sel.innerHTML = "";
    activities.forEach((a, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = `${a.name} (${a.words.length} word${a.words.length === 1 ? "" : "s"})`;
      sel.appendChild(o);
    });
    if (actIdx >= activities.length) actIdx = 0;
    sel.value = actIdx;
  }
  $("actSelect").onchange = (e) => {
    actIdx = +e.target.value;
    wIdx = 0;
    openWord();
  };

  const curWord = () => activities[actIdx] && activities[actIdx].words[wIdx];
  function state() {
    progress[actIdx] = progress[actIdx] || {};
    return (progress[actIdx][wIdx] = progress[actIdx][wIdx] || {
      guesses: [],
      over: false,
      won: false,
    });
  }

  function openWord() {
    const a = activities[actIdx],
      w = curWord();
    if (!a || !w) {
      $("board").innerHTML = "";
      $("clueList").innerHTML = "";
      $("wordLabel").textContent = "";
      $("prevBtn").disabled = $("nextBtn").disabled = true;
      $("msg").textContent =
        "No activities yet — add one in the Create tab or import a file.";
      return;
    }
    typed = "";
    typer.value = "";
    busy = false;
    const st = state();

    $("wordLabel").innerHTML = "";
    const b = document.createElement("div");
    b.textContent = `Word ${wIdx + 1} of ${a.words.length}`;
    const s = document.createElement("small");
    s.textContent = `${w.word.length} letters${st.won ? " · ✓ solved" : ""}`;
    $("wordLabel").append(b, s);
    $("prevBtn").disabled = wIdx === 0;
    $("nextBtn").disabled = wIdx === a.words.length - 1;

    const list = $("clueList");
    list.innerHTML = "";
    (w.clues.length ? w.clues : ["(No clues provided)"]).forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      list.appendChild(li);
    });

    buildBoard(w.word.length);
    st.guesses.forEach((g, i) => paintRow(i, g, evaluate(g, w.word)));
    paintTyping();
    if (st.over)
      $("msg").textContent = st.won ? "Solved! 🎉" : "The word was " + w.word;
    else $("msg").textContent = "";
    focusTyper();
  }

  $("prevBtn").onclick = () => {
    if (wIdx > 0) {
      wIdx--;
      openWord();
    }
  };
  $("nextBtn").onclick = () => {
    if (wIdx < activities[actIdx].words.length - 1) {
      wIdx++;
      openWord();
    }
  };
  $("restartBtn").onclick = () => {
    if (curWord()) {
      delete progress[actIdx][wIdx];
      openWord();
    }
  };

  function buildBoard(n) {
    const b = $("board");
    b.parentElement.style.setProperty("--n", n);
    b.innerHTML = "";
    for (let r = 0; r < MAX_TRIES; r++) {
      const row = document.createElement("div");
      row.className = "rowg";
      for (let c = 0; c < n; c++) {
        const t = document.createElement("div");
        t.className = "tile";
        row.appendChild(t);
      }
      b.appendChild(row);
    }
  }

  const rowEl = (i) => $("board").children[i];
  function paintRow(i, guess, res) {
    const row = rowEl(i);
    if (!row) return;
    [...row.children].forEach((t, j) => {
      t.textContent = guess[j];
      t.className = "tile " + res[j];
    });
  }
  function paintTyping() {
    typer.value = typed;
    const row = rowEl(state().guesses.length);
    if (!row) return;
    [...row.children].forEach((t, i) => {
      t.textContent = typed[i] || "";
      t.classList.toggle("filled", !!typed[i]);
    });
  }

  function evaluate(guess, answer) {
    const res = Array(guess.length).fill("absent"),
      pool = {};
    for (let i = 0; i < answer.length; i++) {
      if (guess[i] === answer[i]) res[i] = "correct";
      else pool[answer[i]] = (pool[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < guess.length; i++) {
      if (res[i] === "correct") continue;
      if (pool[guess[i]] > 0) {
        res[i] = "present";
        pool[guess[i]]--;
      }
    }
    return res;
  }

  function press(k) {
    const w = curWord();
    if (!w) return;
    const st = state();
    if (st.over || busy) return;
    const n = w.word.length;
    if (k === "Enter") {
      if (typed.length < n) {
        $("msg").textContent = "Not enough letters";
        const r = rowEl(st.guesses.length);
        r.classList.remove("shake");
        void r.offsetWidth;
        r.classList.add("shake");
        return;
      }
      submit(w, st);
    } else if (k === "Backspace") {
      typed = typed.slice(0, -1);
      $("msg").textContent = "";
      paintTyping();
    } else if (/^[a-z]$/i.test(k) && typed.length < n) {
      typed += k.toUpperCase();
      paintTyping();
    }
  }

  function submit(w, st) {
    const guess = typed,
      rowIdx = st.guesses.length,
      res = evaluate(guess, w.word),
      row = rowEl(rowIdx);
    const myAct = actIdx,
      myW = wIdx;
    busy = true;
    $("msg").textContent = "";
    [...row.children].forEach((t, i) => {
      t.style.animationDelay = i * 0.2 + "s";
      t.classList.add("flip");
      setTimeout(
        () => {
          t.classList.remove("filled");
          t.classList.add(res[i]);
        },
        i * 200 + 220,
      );
    });
    setTimeout(
      () => {
        st.guesses.push(guess);
        typed = "";
        typer.value = "";
        busy = false;
        if (guess === w.word) st.won = st.over = true;
        else if (st.guesses.length >= MAX_TRIES) st.over = true;
        // only update screen if the player is still on this word
        if (myAct === actIdx && myW === wIdx) {
          if (st.won) {
            $("msg").textContent = [
              "Genius!",
              "Magnificent!",
              "Impressive!",
              "Splendid!",
              "Great!",
              "Phew!",
            ][rowIdx];
            openLabelOnly();
          } else if (st.over) $("msg").textContent = "The word was " + w.word;
        }
      },
      (res.length - 1) * 200 + 700,
    );
  }
  function openLabelOnly() {
    const small = $("wordLabel").querySelector("small");
    if (small && !small.textContent.includes("solved"))
      small.textContent += " · ✓ solved";
  }

  /* ---------- device keyboard input ---------- */
  // The hidden input works with physical keyboards AND phone/tablet
  // on-screen keyboards (which don't always send reliable keydown events),
  // so letters/backspace are read from the input's value instead.
  typer.addEventListener("input", () => {
    const w = curWord();
    if (!w) {
      typer.value = "";
      return;
    }
    const st = state();
    if (st.over || busy) {
      typer.value = typed; // ignore typing while locked
      return;
    }
    const next = typer.value
      .replace(/[^a-z]/gi, "")
      .toUpperCase()
      .slice(0, w.word.length);
    typed = next;
    $("msg").textContent = "";
    paintTyping();
  });
  typer.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      press("Enter");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      $("prevBtn").click();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      $("nextBtn").click();
    }
  });

  // Fallback: if focus is elsewhere (e.g. on a button), typing still works
  document.addEventListener("keydown", (e) => {
    if (!playing() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    )
      return;
    if (e.key === "ArrowLeft") {
      $("prevBtn").click();
      return;
    }
    if (e.key === "ArrowRight") {
      $("nextBtn").click();
      return;
    }
    if (e.key === "Enter" || e.key === "Backspace" || /^[a-z]$/i.test(e.key)) {
      e.preventDefault();
      focusTyper();
      press(e.key);
    }
  });

  // Tapping the clues/word area also brings the keyboard back
  $("play").addEventListener("click", (e) => {
    if (e.target.closest("button, select, input")) return;
    focusTyper();
  });

  /* =========================================================
     CREATE
     ========================================================= */
  const cleanWord = (s) =>
    String(s || "")
      .replace(/[^a-z]/gi, "")
      .toUpperCase();
  $("mWord").addEventListener(
    "input",
    (e) => (e.target.value = cleanWord(e.target.value)),
  );

  function renderDraft() {
    const box = $("draftList");
    box.innerHTML = "";
    if (!draft.words.length) {
      box.innerHTML = '<div class="empty">No words added yet.</div>';
      return;
    }
    draft.words.forEach((w, i) => {
      const d = document.createElement("div");
      d.className = "item";
      const info = document.createElement("div");
      info.className = "info";
      const b = document.createElement("b");
      b.className = "mono";
      b.textContent = `${i + 1}. ${w.word}`;
      const s = document.createElement("small");
      s.textContent = `${w.clues.length} clue${w.clues.length === 1 ? "" : "s"}`;
      info.append(b, s);
      d.append(
        info,
        btn("Edit", "sec", () => editWord(i)),
        btn("✕", "danger", () => {
          draft.words.splice(i, 1);
          if (editingWord === i) resetWordForm();
          renderDraft();
        }),
      );
      box.appendChild(d);
    });
  }
  function btn(txt, cls, fn) {
    const x = document.createElement("button");
    x.className = "btn " + cls;
    x.textContent = txt;
    x.onclick = fn;
    return x;
  }

  function resetWordForm() {
    editingWord = -1;
    $("mWord").value = "";
    $("mClues").value = "";
    $("wordErr").textContent = "";
    $("addWordBtn").textContent = "+ Add word";
    $("wordFormTitle").textContent = "Add a hidden word";
    $("cancelWordBtn").style.display = "none";
  }
  function editWord(i) {
    editingWord = i;
    $("mWord").value = draft.words[i].word;
    $("mClues").value = draft.words[i].clues.join("\n");
    $("addWordBtn").textContent = "Update word";
    $("wordFormTitle").textContent = "Edit hidden word";
    $("cancelWordBtn").style.display = "";
    $("mWord").focus();
  }
  $("cancelWordBtn").onclick = resetWordForm;

  $("addWordBtn").onclick = () => {
    const word = cleanWord($("mWord").value);
    const clues = $("mClues")
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (word.length < 3 || word.length > 12) {
      $("wordErr").textContent = "Word must be 3–12 letters (A–Z only).";
      return;
    }
    if (!clues.length) {
      $("wordErr").textContent = "Add at least one clue.";
      return;
    }
    if (editingWord >= 0) draft.words[editingWord] = { word, clues };
    else draft.words.push({ word, clues });
    resetWordForm();
    renderDraft();
  };

  function resetActForm() {
    editingAct = -1;
    draft = { name: "", words: [] };
    $("aName").value = "";
    $("actErr").textContent = "";
    $("saveActBtn").textContent = "Save activity";
    $("formTitle").textContent = "New activity";
    $("cancelActBtn").style.display = "none";
    resetWordForm();
    renderDraft();
  }
  $("cancelActBtn").onclick = resetActForm;

  $("saveActBtn").onclick = () => {
    const name = $("aName").value.trim();
    if (!name) {
      $("actErr").textContent = "Give the activity a name or number.";
      return;
    }
    if (!draft.words.length) {
      $("actErr").textContent = "Add at least one word first.";
      return;
    }
    const act = {
      name,
      words: draft.words.map((w) => ({
        word: w.word,
        clues: w.clues.slice(),
      })),
    };
    if (editingAct >= 0) activities[editingAct] = act;
    else activities.push(act);
    progress = {};
    save();
    resetActForm();
    renderActList();
    renderSelect();
  };

  function editAct(i) {
    const a = activities[i];
    editingAct = i;
    draft = { name: a.name, words: JSON.parse(JSON.stringify(a.words)) };
    $("aName").value = a.name;
    resetWordForm();
    renderDraft();
    $("saveActBtn").textContent = "Save changes";
    $("formTitle").textContent = "Edit activity";
    $("cancelActBtn").style.display = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderActList() {
    const box = $("actList");
    box.innerHTML = "";
    if (!activities.length) {
      box.innerHTML = '<div class="empty">No activities yet.</div>';
      return;
    }
    activities.forEach((a, i) => {
      const d = document.createElement("div");
      d.className = "item";
      const info = document.createElement("div");
      info.className = "info";
      const b = document.createElement("b");
      b.textContent = a.name;
      const s = document.createElement("small");
      s.textContent = `${a.words.length} word${a.words.length === 1 ? "" : "s"}`;
      info.append(b, s);
      d.append(
        info,
        btn("Play", "", () => {
          actIdx = i;
          wIdx = 0;
          showTab("play");
          renderSelect();
          openWord();
        }),
        btn("Edit", "sec", () => editAct(i)),
        btn("⬇", "sec", () => download([a], a.name)),
        btn("✕", "danger", () => {
          if (!confirm(`Delete "${a.name}"?`)) return;
          activities.splice(i, 1);
          if (editingAct === i) resetActForm();
          progress = {};
          save();
          renderActList();
          renderSelect();
        }),
      );
      box.appendChild(d);
    });
  }

  /* =========================================================
     DOWNLOAD / IMPORT
     ========================================================= */
  function download(list, nameHint) {
    if (!list.length) {
      alert("Nothing to download yet.");
      return;
    }
    const file =
      (nameHint || "codle-activities")
        .trim()
        .replace(/[^\w\-]+/g, "_")
        .replace(/^_+|_+$/g, "") || "codle-activity";
    const blob = new Blob(
      [JSON.stringify({ codle: 2, activities: list }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("dlAllBtn").onclick = () => download(activities, "codle-activities");

  function cleanWords(arr) {
    return (Array.isArray(arr) ? arr : [])
      .map((w) => ({
        word: cleanWord(w && w.word),
        clues: (Array.isArray(w && w.clues) ? w.clues : [])
          .map((c) => String(c).trim())
          .filter(Boolean),
      }))
      .filter(
        (w) => w.word.length >= 3 && w.word.length <= 12 && w.clues.length,
      );
  }
  function parseImport(data) {
    let acts = [];
    if (Array.isArray(data)) data = { activities: data };
    if (data && Array.isArray(data.activities)) {
      acts = data.activities.map((a, i) => ({
        name: String((a && a.name) || "Imported " + (i + 1))
          .trim()
          .slice(0, 50),
        words: cleanWords(a && a.words),
      }));
    } else if (data && Array.isArray(data.words)) {
      acts = [
        {
          name: String(data.name || "Imported activity")
            .trim()
            .slice(0, 50),
          words: cleanWords(data.words),
        },
      ];
    } else if (data && Array.isArray(data.puzzles)) {
      // old single-word format
      acts = [{ name: "Imported activity", words: cleanWords(data.puzzles) }];
    }
    return acts.filter((a) => a.words.length);
  }

  const openPicker = () => $("impFile").click();
  $("impBtn1").onclick = openPicker;
  $("impBtn2").onclick = openPicker;
  $("impFile").onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const good = parseImport(JSON.parse(r.result));
        if (!good.length) throw 0;
        let replace = false;
        if (activities.length)
          replace = confirm(
            `Found ${good.length} activity(ies).\n\nOK = replace my activities\nCancel = add to my activities`,
          );
        const firstNew = replace ? 0 : activities.length;
        activities = replace ? good : activities.concat(good);
        progress = {};
        actIdx = firstNew;
        wIdx = 0;
        resetActForm();
        save();
        renderActList();
        renderSelect();
        showTab("play");
        openWord();
      } catch (err) {
        alert("Couldn't read that file. Use a JSON file downloaded from Codle.");
      }
      e.target.value = "";
    };
    r.readAsText(f);
  };

  /* ---------- init ---------- */
  renderDraft();
  renderActList();
  renderSelect();
  openWord();
})();