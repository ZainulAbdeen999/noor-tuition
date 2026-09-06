/* ================================================================
   NoorEdu — Tuition Center Manager (offline, data stays on device)
   Data saved in localStorage, no internet/server needed
   ================================================================ */

'use strict';

const CLASSES = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const LS_KEY = 'nooredu_v4';
const LS_THEME = 'nooredu_theme';

const $ = id => document.getElementById(id);

/* ---------- DATA ---------- */
let appData = { settings: { centerName: 'Noor Tuition Center', currency: '₹' }, students: [], attendance: {}, activity: [], mf: {} };
let search = '';
let clsFilter = '';
let attTemp = {};
let attDate = '';
let attClass = '';
let feeList = [];
let attChartObj = null;
let classChartObj = null;

function blankData() {
    return {
        settings: Object.assign({ centerName: 'Noor Tuition Center', currency: '₹' }, appData.settings || {}),
        students: [], attendance: {}, activity: [], mf: {}
    };
}
function normalizeAppData() {
    if (!appData.settings) appData.settings = { centerName: 'Noor Tuition Center', currency: '₹' };
    if (!appData.students) appData.students = [];
    if (!appData.attendance) appData.attendance = {};
    if (!appData.activity) appData.activity = [];
    if (!appData.mf) appData.mf = {};
    if (!appData.settings.centerName) appData.settings.centerName = 'Noor Tuition Center';
    if (!appData.settings.currency) appData.settings.currency = '₹';
}
function load() {
    try {
        const d = JSON.parse(localStorage.getItem(LS_KEY));
        if (d) appData = d;
    } catch (e) { appData = blankData(); }
    normalizeAppData();
}
function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(appData)); } catch (e) { toast('Storage full — delete some data', 'err'); }
}
function money(n) {
    const c = (appData.settings && appData.settings.currency) || '₹';
    return c + (Number(n) || 0);
}
function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- TOAST (non-blocking, can never get stuck) ---------- */
function toast(msg, type) {
    const box = $('toastBox');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.innerHTML = '<i class="bi ' + (type === 'err' ? 'bi-exclamation-circle' : type === 'ok' ? 'bi-check-circle' : 'bi-info-circle') + '"></i><span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 350); }, 2300);
}

/* ---------- THEME ---------- */
function initTheme() {
    const saved = localStorage.getItem(LS_THEME);
    const dark = saved ? saved === 'dark' : true;
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    updateIcons(dark);
}
function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    document.documentElement.setAttribute('data-bs-theme', cur ? 'light' : 'dark');
    localStorage.setItem(LS_THEME, cur ? 'light' : 'dark');
    updateIcons(!cur);
    redrawCharts();
}
function updateIcons(dark) {
    const sun = $('themeToggle').querySelector('i');
    sun.className = dark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}

/* ---------- NAVIGATION ---------- */
function nav(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pg = $('page-' + page);
    if (pg) pg.classList.add('active');
    document.querySelectorAll('.bnav').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'dashboard') renderDashboard();
    if (page === 'students') renderStudents();
    if (page === 'attendance') loadAttendance();
    if (page === 'fees') loadFees();
    if (page === 'settings') loadSettings();
}

/* ---------- DASHBOARD ---------- */
function weeksLabel() {
    const from = new Date();
    from.setDate(from.getDate() - 6);
    const labs = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        labs.push(d.toLocaleDateString('en', { day: 'numeric', month: 'short' }));
    }
    return labs;
}

function renderDashboard() {
    const students = appData.students;
    const today = todayISO();
    const att = appData.attendance[today] || {};
    const presentN = Object.keys(att).filter(id => att[id] === 'present').length;

    $('stStudents').textContent = students.length;
    $('stClasses').textContent = new Set(students.map(s => s.cls)).size;
    $('stPresent').textContent = presentN;
    $('stFees').textContent = money(totalFeesCollected());

    $('helloEyebrow').textContent = greeting();
    $('helloSub').textContent = appData.settings.centerName || 'Manage Noor Tuition Center';
    $('helloTitle').textContent = greeting() + ' 👋';

    $('onboardCard').style.display = students.length ? 'none' : 'block';

    // activity
    const feed = $('activityFeed');
    const acts = appData.activity.slice().reverse().slice(0, 10);
    if (!acts.length) {
        feed.innerHTML = '<div class="feed-empty">No activity yet — your actions will appear here.</div>';
    } else {
        feed.innerHTML = acts.map(a => {
            const ic = a.ic || 'bi-dot';
            return '<div class="feed-it"><span class="feed-ic"><i class="bi ' + ic + '"></i></span>' +
                '<span class="feed-t">' + esc(a.t) + '</span>' +
                '<span class="feed-d">' + esc(a.d) + '</span></div>';
        }).join('');
    }

    drawAttChart();
    drawClassChart();
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function totalFeesCollected() {
    let sum = 0;
    appData.students.forEach(s => {
        const paid = appData.mf[s.id] || {};
        if (paid.paid && paid.amount) sum += Number(paid.amount);
    });
    return sum;
}

function drawAttChart() {
    const cv = $('attChart');
    const labs = weeksLabel();
    const vals = labs.map((l, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (5 - i));
        const key = keyOfDate(d);
        const a = appData.attendance[key];
        if (!a) return 0;
        return Object.keys(a).filter(id => a[id] === 'present').length;
    });
    const totalAvail = labs.reduce((m, l, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (5 - i));
        const a = appData.attendance[keyOfDate(d)];
        return m + (a ? Object.keys(a).length : 0);
    }, 0);
    $('attWeekAvg').textContent = totalAvail ? Math.round(vals.reduce((a, b) => a + b, 0) / totalAvail * 100) + '% avg' : 'No data';

    if (!window.Chart) return;
    if (attChartObj) attChartObj.destroy();
    const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const grid = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)';
    const txt = dark ? '#8b93a7' : '#6b7280';
    attChartObj = new Chart(cv, {
        type: 'line',
        data: { labels: labs, datasets: [{
            label: 'Present',
            data: vals,
            borderColor: '#6c7cff',
            backgroundColor: 'rgba(108,124,255,.18)',
            fill: true,
            tension: .4,
            pointRadius: 3,
            pointBackgroundColor: '#6c7cff',
            borderWidth: 2.5
        }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0, color: txt, font: { size: 10 } }, grid: { color: grid } },
                x: { ticks: { color: txt, font: { size: 10 } }, grid: { display: false } }
            }
        }
    });
}

function keyOfDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function drawClassChart() {
    const cv = $('classChart');
    const counts = CLASSES.map(c => appData.students.filter(s => s.cls === c).length).filter(n => n > 0);
    const labels = CLASSES.filter((c, i) => appData.students.some(s => s.cls === c));
    if (!counts.length) {
        if (classChartObj) { classChartObj.destroy(); classChartObj = null; }
        cv.closest('.chart-box').innerHTML = '<div class="feed-empty" style="padding:26px 0">No students yet — add students to see the chart.</div>';
        return;
    }
    const box = cv.closest('.chart-box');
    if (box.querySelector('.feed-empty')) box.innerHTML = '<canvas id="classChart"></canvas>';

    if (!window.Chart) return;
    if (classChartObj) classChartObj.destroy();
    const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const txt = dark ? '#8b93a7' : '#6b7280';
    const pal = ['#6c7cff', '#34d399', '#f59e0b', '#f472b6', '#22d3ee', '#a78bfa', '#fb7185', '#facc15', '#4ade80', '#60a5fa'];
    classChartObj = new Chart(cv, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: counts, backgroundColor: pal, borderWidth: 0, hoverOffset: 4 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: txt, padding: 12, boxWidth: 10, font: { size: 11 } } }
            }
        }
    });
}

function redrawCharts() {
    drawAttChart();
    drawClassChart();
}

/* ---------- CLASS OPTIONS ---------- */
function fillClassOptions() {
    const s = $('sClass');
    s.innerHTML = CLASSES.map((c, i) => '<option value="' + c + '"' + (i === 2 ? ' selected' : '') + '>' + c + '</option>').join('');
    $('sSection').innerHTML = ['A', 'B'].map(x => '<option>' + x + '</option>').join('');
}

/* ---------- CHIPS ---------- */
function renderChips() {
    const counts = {};
    appData.students.forEach(s => counts[s.cls] = (counts[s.cls] || 0) + 1);
    $('chipAll').textContent = appData.students.length;
    $('chipWrap').innerHTML = CLASSES.filter(c => counts[c]).map(c =>
        '<span class="chip' + (clsFilter === c ? ' active' : '') + '" data-cls="' + c + '" onclick="pickClass(this)">' + c + ' <b>' + counts[c] + '</b></span>'
    ).join('');

}

function pickClass(chipEl) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');
    clsFilter = chipEl.dataset.cls || '';
    renderStudents();
}

/* ---------- STUDENTS LIST ---------- */
function renderStudents() {
    const q = ($('searchInput').value || '').trim().toLowerCase();
    let list = appData.students.filter(s =>
        (!clsFilter || s.cls === clsFilter) &&
        (!q || (s.name + ' ' + s.father + ' ' + s.phone + ' ' + s.cls).toLowerCase().includes(q))
    );
    $('countText').textContent = list.length + ' / ' + appData.students.length;
    const row = $('studentsRows');

    if (!list.length) {
        row.innerHTML = '<div class="feed-empty">No students found' + (q || clsFilter ? ' — change filter' : ' — tap + to add one') + '.</div>';
        return;
    }

    row.innerHTML = list.map(s => {
        const paid = appData.mf[s.id] || {};
        let status;
        if (paid.paid) status = '<span class="pill pill-green">Paid</span>';
        else if (s.fee) status = paid.amount ? '<span class="pill pill-amber">Partial ' + money(paid.amount) + '</span>' : '<span class="pill pill-red">Due ' + money(s.fee) + '</span>';
        else status = '';
        const clr = avatarColor(s.name);
        return '<div class="stu-card" onclick="showStudent(\'' + s.id + '\')">' +
            '<div class="stu-av" style="background:' + clr + '">' + esc(initials(s.name)) + '</div>' +
            '<div class="stu-info"><div class="stu-name">' + esc(s.name) + '</div>' +
            '<div class="stu-cc">Class ' + esc(s.cls) + (s.section ? ' · ' + esc(s.section) : '') + (s.father ? ' · Phsb ' + esc(s.father) : '') + '</div></div>' +
            '<div class="stu-acts">' + status +
            '<button class="card-btn" onclick="event.stopPropagation();editStudent(\'' + s.id + '\')"><i class="bi bi-pencil"></i></button>' +
            '<button class="card-btn danger" onclick="event.stopPropagation();askDelete(\'' + s.id + '\')"><i class="bi bi-trash"></i></button></div>' +
            '</div>';
    }).join('');
}

function avatarColor(name) {
    const pal = ['#6c7cff', '#34d399', '#f59e0b', '#f472b6', '#22d3ee', '#a78bfa', '#fb7185'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return pal[h % pal.length];
}
function initials(name) {
    const p = name.trim().split(/\s+/);
    return ((p[0] ? p[0][0] : '') + (p[1] ? p[1][0] : '')).toUpperCase();
}

/* ---------- STUDENT DETAIL (dismissible by tap outside / Esc / X) ---------- */
function showStudent(id) {
    const s = appData.students.find(x => x.id === id);
    if (!s) return;
    const paid = appData.mf[id] || {};
    const dueAmt = s.fee && !paid.paid ? Math.max(0, s.fee - (paid.amount || 0)) : 0;
    const status = paid.paid ? '<span class="pill pill-green">Paid ✓</span>'
        : (s.fee ? '<span class="pill pill-red">' + (dueAmt ? 'Due ' + money(dueAmt) : 'Partial ' + money(paid.amount)) + '</span>' : '<span class="pill pill-gray">No fee</span>');
    const row = (k, v) => '<div class="sd-row"><span>' + k + '</span><b>' + v + '</b></div>';

    Swal.fire({
        title: '<span class="bd-name">' + esc(s.name) + '</span>',
        html:
            '<div class="bd-c"></div>' +
            '<div class="sd-card">' +
            row('Class', esc(s.cls) + (s.section ? ' · ' + esc(s.section) : '')) +
            row('Gender', esc(s.gender)) +
            (s.age ? row('Age', esc(s.age) + ' yrs') : '') +
            (s.father ? row("Father's name", esc(s.father)) : '') +
            row('Phone', esc(s.phone)) +
            row('Admitted', esc(s.date || '—')) +
            (s.address ? row('Address', esc(s.address)) : '') +
            (s.notes ? row('Notes', esc(s.notes)) : '') +
            row('Status', status) +
            '</div>',
        icon: 'info',
        showCloseButton: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        confirmButtonText: paid.paid ? '<i class="bi bi-pencil"></i> Edit' : '<i class="bi bi-cash-stack"></i> Mark paid',
        showCancelButton: true,
        cancelButtonText: '<i class="bi bi-pencil-square"></i> Edit',
        confirmButtonColor: paid.paid ? '#6c7cff' : '#34d399',
        cancelButtonColor: '#6c7cff',
        customClass: { popup: 'sw-dark' }
    }).then(r => {
        if (r.isConfirmed) {
            if (paid.paid) { editStudent(id); }
            else { markFee(id); }
        } else if (r.dismiss === Swal.DismissReason.cancel) {
            editStudent(id);
        }
    });
}

/* ---------- ADD / EDIT ---------- */
function clearForm() {
    $('editId').value = '';
    $('addTitle').textContent = 'New Student';
    ['sName', 'sAge', 'sFather', 'sPhone', 'sFee', 'sDate', 'sAddress', 'sNotes'].forEach(i => $(i).value = '');
    $('sName').value = '';
    $('sDate').value = todayISO();
    fillClassOptions();
    $('sGender').selectedIndex = 0;
}

function editStudent(id) {
    const s = appData.students.find(x => x.id === id);
    if (!s) return;
    $('editId').value = id;
    $('addTitle').textContent = 'Edit Student';
    $('sName').value = s.name;
    $('sClass').value = s.cls;
    $('sSection').value = s.section || '';
    $('sGender').value = s.gender || '';
    $('sAge').value = s.age || '';
    $('sFather').value = s.father || '';
    $('sPhone').value = s.phone || '';
    $('sFee').value = s.fee || '';
    $('sDate').value = s.date || todayISO();
    $('sAddress').value = s.address || '';
    $('sNotes').value = s.notes || '';
    nav('add');
}

function saveStudent() {
    const name = $('sName').value.trim();
    const cls = $('sClass').value;
    const gender = $('sGender').value;
    const phone = $('sPhone').value.trim();
    if (!name || !cls || !gender || !phone) {
        toast('Please fill Name, Class, Gender & Phone', 'err');
        return;
    }
    const id = $('editId').value;
    const data = {
        name: name,
        cls: cls,
        section: $('sSection').value,
        gender: gender,
        age: $('sAge').value || '',
        father: $('sFather').value.trim(),
        phone: phone,
        fee: $('sFee').value || 0,
        date: $('sDate').value || todayISO(),
        address: $('sAddress').value.trim(),
        notes: $('sNotes').value.trim()
    };
    if (id) {
        const s = appData.students.find(x => x.id === id);
        if (s) Object.assign(s, data);
        addActivity('Updated', data.name + ' (Class ' + data.cls + ')', 'bi-pencil');
        toast('Student updated', 'ok');
    } else {
        data.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        data.mf = {};
        appData.students.push(data);
        addActivity('Added', data.name + ' (Class ' + data.cls + ')', 'bi-person-plus');
        toast('Student added', 'ok');
    }
    save();
    renderDashboard();
    renderChips();
    nav('students');
}

function askDelete(id) {
    const s = appData.students.find(x => x.id === id);
    if (!s) return;
    Swal.fire({
        title: 'Delete student?',
        html: 'Remove <b>' + esc(s.name) + '</b> permanently?<br>All attendance & fee records for this student will also be removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-trash"></i> Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#f87171',
        allowOutsideClick: true,
        allowEscapeKey: true,
        customClass: { popup: 'sw-dark' }
    }).then(r => {
        if (!r.isConfirmed) return;
        appData.students = appData.students.filter(x => x.id !== id);
        delete appData.mf[id];
        Object.keys(appData.attendance).forEach(k => delete appData.attendance[k][id]);
        save();
        addActivity('Deleted', s.name, 'bi-trash');
        toast('Student deleted', 'ok');
        renderDashboard();
        renderChips();
        if ($('page-students').classList.contains('active')) renderStudents();
    });
}

function addActivity(t, d, ic) {
    const now = new Date();
    const stamp = now.toLocaleDateString('en', { day: 'numeric', month: 'short' }) + ' ' + now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    appData.activity.push({ t: t, d: d, ic: ic, date: stamp });
    if (appData.activity.length > 120) appData.activity = appData.activity.slice(-120);
}

/* ---------- ATTENDANCE ---------- */
function loadAttendance() {
    attDate = $('attDate').value || todayISO();
    $('attDate').value = attDate;
    attClass = $('attClass').value || '';
    setAttOptions();
    renderAttList();
}

function setAttOptions() {
    const sel = $('attClass');
    const cur = attClass;
    sel.innerHTML = '<option value="">All Classes</option>' + CLASSES.map(c =>
        '<option value="' + c + '">' + c + '</option>').join('');
    sel.value = cur;
}

function renderAttList() {
    const box = $('attList');
    const rec = appData.attendance[attDate] || {};
    attTemp = Object.assign({}, rec);

    let list = appData.students;
    if (attClass) list = list.filter(s => s.cls === attClass);
    if (!list.length) {
        box.innerHTML = '<div class="feed-empty">No students' + (attClass ? ' in this class' : ' yet') + '.</div>';
    } else {
        box.innerHTML = list.map(s =>
            '<div class="att-row"><div class="stu-av" style="background:' + avatarColor(s.name) + '">' + esc(initials(s.name)) + '</div>' +
            '<div style="flex:1;min-width:0"><div class="stu-name">' + esc(s.name) + '</div><div class="stu-cc">Class ' + esc(s.cls) + '</div></div>' +
            '<button class="tgg p' + (attTemp[s.id] === 'present' ? ' on-p' : '') + '" onclick="flip(\'' + s.id + '\',\'present\')"><i class="bi bi-check-lg"></i> P</button>' +
            '<button class="tgg a' + (attTemp[s.id] === 'absent' ? ' on-a' : '') + '" onclick="flip(\'' + s.id + '\',\'absent\')"><i class="bi bi-x-lg"></i> A</button>' +
            '</div>'
        ).join('');
    }

    const p = Object.keys(attTemp).filter(id => attTemp[id] === 'present').length;
    const n = Object.keys(attTemp).filter(id => attTemp[id] === 'absent').length;
    $('attSummary').innerHTML = '<span class="as p"><i class="bi bi-check-circle"></i> ' + p + ' Present</span><span class="as a"><i class="bi bi-x-circle"></i> ' + n + ' Absent</span><span class="as n">' + (list.length - p - n) + ' Not marked</span>';

    renderAttReport(list);
}

function flip(id, st) {
    attTemp[id] = st;
    renderAttList();
}

function fillAll(st) {
    if (!appData.students.length) return toast('No students yet', 'err');
    let list = appData.students;
    if (attClass) list = list.filter(s => s.cls === attClass);
    list.forEach(s => attTemp[s.id] = st);
    renderAttList();
}

function saveAttendance() {
    if (!Object.keys(attTemp).length && !appData.students.length) return toast('No students to mark', 'err');
    const rec = appData.attendance[attDate] || {};
    appData.attendance[attDate] = Object.assign(rec, attTemp);
    const p = Object.keys(attTemp).filter(id => attTemp[id] === 'present').length;
    save();
    addActivity('Marked attendance', attDate + (attClass ? ' (' + attClass + ')' : '') + ' · ' + p + ' present', 'bi-clipboard2-check');
    toast('Attendance saved · ' + p + ' present', 'ok');
    renderAttList();
}

function renderAttReport(list) {
    const box = $('attReportBody');
    const rec = appData.attendance[attDate] || {};
    if (!list || !list.length) {
        box.innerHTML = '<div class="feed-empty">No data for this date.</div>';
        return;
    }
    let p = 0, g = 0, f = 0;
    list.forEach(s => {
        if (rec[s.id] === 'present') p++;
        else if (rec[s.id] === 'absent') g++;
        else f++;
    });
    const pct = list.length ? Math.round(p / list.length * 100) : 0;
    box.innerHTML = '<div class="rep-row"><span>Present</span><b class="g">' + p + '</b></div>' +
        '<div class="rep-row"><span>Absent</span><b class="r">' + g + '</b></div>' +
        '<div class="rep-row"><span>Not marked</span><b class="m">' + f + '</b></div>' +
        '<div class="rep-bar"><div class="rep-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="rep-pct">' + pct + '% present</div>';
}

/* ---------- FEES ---------- */
function loadFees() {
    const m = $('feeMonth').value;
    fillFeeMonths(m);
    fillFeeClass();
    renderFees();
}

function fillFeeMonths(keep) {
    const sel = $('feeMonth');
    if (!sel.dataset.init) {
        sel.innerHTML = MONTHS.map((m, i) => '<option value="' + m + '">' + m + '</option>').join('');
        sel.dataset.init = '1';
    }
    sel.value = keep;
}

function fillFeeClass() {
    const sel = $('feeClass');
    const cur = sel.value || '';
    sel.innerHTML = '<option value="">All Classes</option>' + CLASSES.map(c => '<option value="' + c + '">' + c + '</option>').join('');
    sel.value = cur;
}

function renderFees() {
    const month = $('feeMonth').value;
    const cls = $('feeClass').value;
    const monthKey = mKey(month);

    let list = appData.students.filter(s => (!cls || s.cls === cls));
    feeList = list.map(s => {
        const mf = appData.mf[s.id] || {};
        const rec = mf[monthKey] || {};
        rec.amount = rec.amount || 0;
        rec.paid = !!rec.paid;
        return Object.assign({}, s, { _mf: rec });
    });

    const pd = feeList.filter(s => s._mf.paid).length;
    const total = feeList.reduce((x, s) => x + (Number(s.fee) || 0), 0);
    const collected = feeList.reduce((x, s) => x + (Number(s._mf.amount) || 0), 0);
    const pct = total ? Math.round(collected / total * 100) : 0;

    $('feePaidText').textContent = pd + ' / ' + feeList.length + ' paid';
    $('feePct').textContent = pct + '%';
    $('feeFill').style.width = pct + '%';

    const box = $('feeTable');
    if (!feeList.length) {
        box.innerHTML = '<div class="feed-empty">No students' + (cls ? ' in this class' : ' yet') + ' for ' + month + '.</div>';
        return;
    }

    box.innerHTML = feeList.map(s => {
        const rec = s._mf;
        let stl;
        if (rec.paid) stl = '<span class="pill pill-green">Paid</span>';
        else if (rec.amount > 0) stl = '<span class="pill pill-amber">Paid ' + money(rec.amount) + '</span>';
        else stl = '<span class="pill pill-red">' + money(s.fee) + ' due</span>';
        return '<div class="fee-row"><div class="stu-av" style="background:' + avatarColor(s.name) + '">' + esc(initials(s.name)) + '</div>' +
            '<div class="fee-info"><div class="fee-n">' + esc(s.name) + '</div><div class="fee-c">Class ' + esc(s.cls) + (s.section ? ' · ' + esc(s.section) : '') + (s.fee ? ' · ' + money(s.fee) + '/mo' : '') + '</div>' + stl + '</div>' +
            '<button class="card-btn" onclick="markThis(\'' + s.id + '\')"><i class="bi bi-cash-coin"></i></button>' +
            '</div>';
    }).join('');

    renderFeeReport();
}

function mKey(month) {
    return 'Y' + new Date().getFullYear() + '_' + month;
}

function markThis(id) {
    const s = appData.students.find(x => x.id === id);
    if (!s) return;
    const m = $('feeMonth').value;
    const monthKey = mKey(m);
    const mf = appData.mf[id] = appData.mf[id] || {};
    if (mf[monthKey] && mf[monthKey].paid) {
        toast(esc(s.name) + ' — already marked paid for ' + m, 'ok');
        return;
    }
    Swal.fire({
        title: 'Mark paid?',
        html: '<b>' + esc(s.name) + '</b><br>' + m + ' fee',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-check2"></i> Paid',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#34d399',
        allowOutsideClick: true,
        allowEscapeKey: true,
        customClass: { popup: 'sw-dark' },
        input: 'number',
        inputLabel: 'Amount received (₹)',
        inputValue: s.fee || 0,
        inputAttributes: { min: '0', step: '1', inputmode: 'numeric' }
    }).then(r => {
        if (!r.isConfirmed) return;
        const amt = Number(r.value);
        mf[monthKey] = { paid: true, amount: isNaN(amt) ? 0 : amt };
        save();
        addActivity('Fee paid', s.name + ' · ' + m, 'bi-cash-coin');
        toast(m + ' fee marked paid', 'ok');
        renderDashboard();
        renderFees();
    });
}

function markFee(id) {
    const s = appData.students.find(x => x.id === id);
    if (!s) return;
    markThis(id);
}

function markAllPaid() {
    const month = $('feeMonth').value;
    const cls = $('feeClass').value;
    const monthKey = mKey(month);
    let list = appData.students.filter(s => (!cls || s.cls === cls));
    if (!list.length) return toast('No students for this filter', 'err');
    Swal.fire({
        title: 'Mark all paid?',
        html: 'Mark ALL ' + list.length + ' student(s) as paid for <b>' + month + '</b>' + (cls ? ' (Class ' + cls + ')' : '') + '?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-check2-all"></i> Yes, mark all',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#34d399',
        allowOutsideClick: true,
        allowEscapeKey: true,
        customClass: { popup: 'sw-dark' }
    }).then(r => {
        if (!r.isConfirmed) return;
        list.forEach(s => {
            appData.mf[s.id] = appData.mf[s.id] || {};
            appData.mf[s.id][monthKey] = { paid: true, amount: Number(s.fee) || 0 };
        });
        save();
        addActivity('Marked all paid', month + (cls ? ' (' + cls + ')' : ''), 'bi-cash-stack');
        toast('All paid for ' + month, 'ok');
        renderDashboard();
        renderFees();
    });
}

function renderFeeReport() {
    const box = $('feeReport');
    if (!box) return;
    const month = $('feeMonth').value;
    const monthKey = mKey(month);

    const expected = feeList.reduce((x, s) => x + (Number(s.fee) || 0), 0);
    const collected = feeList.reduce((x, s) => x + (Number(s._mf.amount) || 0), 0);
    const paidN = feeList.filter(s => s._mf.paid).length;
    const pendingN = feeList.length - paidN;

    const byCls = {};
    feeList.forEach(s => {
        const g = byCls[s.cls] = byCls[s.cls] || { n: 0, p: 0, c: 0 };
        g.n++;
        if (s._mf.paid && s._mf.amount) { g.p++; g.c += Number(s._mf.amount); }
    });

    const trend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mk = 'Y' + d.getFullYear() + '_' + MONTHS[d.getMonth()];
        let sum = 0;
        appData.students.forEach(s => {
            const rec = (appData.mf[s.id] || {})[mk];
            if (rec && rec.amount) sum += Number(rec.amount);
        });
        trend.push({ label: MONTHS[d.getMonth()].slice(0, 3) + " '" + String(d.getFullYear()).slice(2), sum: sum });
    }
    const maxTr = Math.max(1, ...trend.map(t => t.sum));

    const clsSorted = Object.keys(byCls).sort();
    const clsHtml = clsSorted.length ? clsSorted.map(c => {
        const g = byCls[c];
        return '<div class="rep-row"><span>Class ' + c + ' <small>(' + g.n + ' students)</small></span><b class="g">' + g.p + '/' + g.n + ' paid · ' + money(g.c) + '</b></div>';
    }).join('') : '<div class="feed-empty">No data for this filter</div>';

    const trendHtml = trend.map(t =>
        '<div class="rep-row"><span>' + t.label + '</span><div class="tr-bar"><div class="tr-fill" style="width:' + Math.round(t.sum / maxTr * 100) + '%"></div></div><b>' + money(t.sum) + '</b></div>'
    ).join('');

    box.innerHTML =
        '<div class="fp-text" style="margin-top:0"><span>Expected: <b style="color:var(--text)">' + money(expected) + '</b></span><span>Collected: <b style="color:var(--green)">' + money(collected) + '</b></span><span>Pending: <b style="color:var(--red)">' + pendingN + '</b></span></div>' +
        '<div class="fp-text" style="margin-top:8px"><span>Class breakdown — ' + month + '</span></div>' +
        clsHtml +
        '<div class="fp-text" style="margin-top:10px"><span>Last 6 months</span></div>' +
        trendHtml;
}

/* ---------- DUE FEES ---------- */
function showDue() {
    const month = $('feeMonth') ? $('feeMonth').value : MONTHS[new Date().getMonth()];
    const monthKey = mKey(month);
    const due = appData.students.filter(s => {
        const mf = appData.mf[s.id] || {};
        return s.fee && !(mf[monthKey] && mf[monthKey].paid);
    });
    if (!due.length) {
        toast('No due fees for ' + month + ' 🎉', 'ok');
        return;
    }
    Swal.fire({
        title: 'Due Fees — ' + month,
        html: '<div class="sd-card">' + due.slice(0, 30).map(s => {
            const mf = appData.mf[s.id] || {};
            const rec = mf[monthKey] || {};
            const left = Math.max(0, (Number(s.fee) || 0) - (Number(rec.amount) || 0));
            return '<div class="sd-row"><span>' + esc(s.name) + ' <small>(' + esc(s.cls) + ')</small></span><b class="text-danger">' + money(left) + '</b></div>';
        }).join('') + '</div>' + (due.length > 30 ? '<div class="feed-empty">+' + (due.length - 30) + ' more…</div>' : ''),
        icon: 'info',
        confirmButtonText: '<i class="bi bi-cash-coin"></i> Collect',
        showCancelButton: true,
        cancelButtonText: 'Close',
        confirmButtonColor: '#f59e0b',
        allowOutsideClick: true,
        allowEscapeKey: true,
        customClass: { popup: 'sw-dark' }
    }).then(r => {
        if (r.isConfirmed) nav('fees');
    });
}

/* ---------- SETTINGS (no code needed) ---------- */
function loadSettings() {
    $('setCenterName').value = appData.settings.centerName || '';
    $('setCurrency').value = appData.settings.currency || '₹';
}
function saveCenter() {
    const v = $('setCenterName').value.trim();
    appData.settings.centerName = v || 'Noor Tuition Center';
    save();
    toast('Center name saved', 'ok');
    renderDashboard();
}
function saveCurrency() {
    const v = $('setCurrency').value.trim().slice(0, 4);
    appData.settings.currency = v || '₹';
    save();
    toast('Currency saved', 'ok');
    renderDashboard();
    loadFees();
    renderStudents();
}

/* ---------- BACKUP / MOVE DATA ---------- */
function exportBackup() {
    const blob = new Blob([JSON.stringify(appData)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'NoorEdu-backup-' + todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    toast('Backup file downloaded', 'ok');
}
function copyData() {
    const txt = JSON.stringify(appData);
    const ok = function () { toast('Data copied — paste karo kisi bhi safe jagah', 'ok'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(ok).catch(function () { fallbackCopy(txt, ok); });
    } else fallbackCopy(txt, ok);
}
function fallbackCopy(txt, cb) {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); if (cb) cb(); } catch (e) { toast('Copy nahi hua — Download use karo', 'err'); }
    ta.remove();
}
function importFile(ev) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = function () { tryImport(r.result); };
    r.readAsText(f);
    ev.target.value = '';
}
function importFromText() {
    const raw = $('importText').value.trim();
    if (!raw) return toast('Pehle backup data paste karo', 'err');
    tryImport(raw);
}
function tryImport(raw) {
    try {
        const d = JSON.parse(raw);
        if (!d || !Array.isArray(d.students)) throw new Error('bad');
        appData = d;
        normalizeAppData();
        save();
        $('importText').value = '';
        toast('Data imported successfully', 'ok');
        renderDashboard();
        renderChips();
        loadSettings();
        if ($('page-students').classList.contains('active')) renderStudents();
    } catch (e) {
        toast('Invalid backup data', 'err');
    }
}
function clearAll() {
    Swal.fire({
        title: 'Delete ALL data?',
        html: 'Sab students, attendance aur fees records <b>hamesha ke liye</b> delete ho jayenge. Ye wapas nahi aa sakta.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-trash"></i> Yes, delete everything',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#f87171',
        allowOutsideClick: true,
        allowEscapeKey: true,
        customClass: { popup: 'sw-dark' }
    }).then(r => {
        if (!r.isConfirmed) return;
        appData = blankData();
        save();
        toast('All data cleared', 'ok');
        renderDashboard();
        renderChips();
        nav('dashboard');
    });
}

/* ---------- INIT ---------- */
function init() {
    load();
    initTheme();
    fillClassOptions();
    $('attDate').value = todayISO();
    attDate = todayISO();
    fillFeeMonths(MONTHS[new Date().getMonth()]);
    nav('dashboard');
    renderChips();
    renderDashboard();
    renderStudents();

    $('studentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveStudent();
    });
    $('searchInput').addEventListener('input', renderStudents);
}

document.addEventListener('DOMContentLoaded', init);