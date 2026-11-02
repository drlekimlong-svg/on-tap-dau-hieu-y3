// On tap dau hieu ngoai khoa Y3. Cau hoi, dap an va anh nam trong data/*.enc.json, ma hoa theo tung nhom.
(function () {
  'use strict';

  var man = document.getElementById('man');
  var nutVe = document.getElementById('nut-ve');
  var dauTen = document.getElementById('dau-ten');
  var dauPhu = document.getElementById('dau-phu');
  var TEN_APP = 'Ôn tập dấu hiệu ngoại khoa';
  var PHU_APP = 'Thực tập lâm sàng Ngoại · Y3';
  var CHU_LC = ['A', 'B', 'C', 'D'];

  var mucLuc = null;      // data/muc_luc.json: nhom cong khai, khong co cau hoi
  var moKhoa = {};        // id nhom -> du lieu da giai ma, chi nam trong bo nho
  var veTrang = null;

  function el(tag, attrs, con) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (con || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function hien(ten, phu, ve, nodes) {
    dauTen.textContent = ten;
    dauPhu.textContent = phu;
    veTrang = ve;
    nutVe.hidden = !ve;
    man.textContent = '';
    nodes.forEach(function (n) { man.appendChild(n); });
    window.scrollTo(0, 0);
    man.focus({ preventScroll: true });
  }
  nutVe.addEventListener('click', function () { if (veTrang) veTrang(); });

  /* ---------- luu cuc bo: chi la tien ich, loi thi bo qua ---------- */
  function docDiem() {
    try { return JSON.parse(localStorage.getItem('y3dh_diem') || '{}'); } catch (e) { return {}; }
  }
  function ghiDiem(idDe, diem) {
    try {
      var d = docDiem();
      if (!(d[idDe] >= diem)) d[idDe] = diem;
      localStorage.setItem('y3dh_diem', JSON.stringify(d));
    } catch (e) { /* trinh duyet chan luu tru */ }
  }

  /* ---------- giai ma ---------- */
  function b64(s) {
    var n = atob(s), a = new Uint8Array(n.length);
    for (var i = 0; i < n.length; i++) a[i] = n.charCodeAt(i);
    return a;
  }
  function chuanHoa(mk) { return mk.trim().toLowerCase(); }

  async function giaiMa(tep, matKhau) {
    var r = await fetch(tep);
    if (!r.ok) throw new Error('tai');
    var g = await r.json();
    var goc = await crypto.subtle.importKey('raw', new TextEncoder().encode(chuanHoa(matKhau)), 'PBKDF2', false, ['deriveKey']);
    var khoa = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: b64(g.salt), iterations: g.iter },
      goc, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var ban;
    try {
      ban = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(g.iv) }, khoa, b64(g.ct));
    } catch (e) { throw new Error('sai'); }
    return JSON.parse(new TextDecoder().decode(ban));
  }

  /* ---------- xao tron ---------- */
  function tron(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- trang nhom ---------- */
  function trangChu() {
    var ds = el('div', { class: 'ds hai-cot' });
    var diem = docDiem();
    mucLuc.nhom.forEach(function (n) {
      var soDat = n.de.filter(function (d) { return diem[d.id] != null; }).length;
      ds.appendChild(el('button', { class: 'the', type: 'button', onclick: function () { moNhom(n); } }, [
        el('div', { class: 'the-ten' }, [
          el('span', { text: n.ten }),
          el('span', { class: 'khoa', 'aria-hidden': 'true', text: moKhoa[n.id] ? '🔓' : '🔒' })
        ]),
        el('div', { class: 'the-phu', text: n.mo_ta }),
        el('div', { class: 'the-phu', text: n.de.length + ' đề · ' + mucLuc.so_cau + ' câu mỗi đề' }),
        soDat ? el('div', { class: 'diem-cao', text: 'Đã làm ' + soDat + '/' + n.de.length + ' đề' }) : null
      ]));
    });
    hien(TEN_APP, PHU_APP, null, [
      el('p', { class: 'gioi-thieu', text: 'Chọn một nhóm và nhập mật khẩu giảng viên cung cấp. Mỗi đề có ' + mucLuc.so_cau + ' câu trắc nghiệm 4 lựa chọn về định nghĩa, biểu hiện, cách khám và nhận diện trên ảnh. Thứ tự câu và đáp án được xáo lại mỗi lần làm.' }),
      ds
    ]);
  }

  function moNhom(n) {
    if (moKhoa[n.id]) trangDe(n); else trangMatKhau(n);
  }

  function trangMatKhau(n) {
    var o = el('input', { type: 'password', id: 'mk', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', required: true });
    var loi = el('p', { class: 'loi', role: 'alert', hidden: true });
    var nut = el('button', { class: 'nut', type: 'submit', text: 'Mở nhóm đề' });
    var f = el('form', { class: 'mat-khau' }, [
      el('label', { for: 'mk', text: 'Mật khẩu của nhóm' }), o,
      loi, el('div', { class: 'hang-nut' }, [nut])
    ]);
    f.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      nut.disabled = true; nut.textContent = 'Đang mở...'; loi.hidden = true;
      try {
        moKhoa[n.id] = await giaiMa(n.tep, o.value);
        trangDe(n);
      } catch (e) {
        loi.textContent = e.message === 'sai' ? 'Mật khẩu chưa đúng. Kiểm tra lại với giảng viên.' : 'Không tải được dữ liệu. Kiểm tra kết nối mạng rồi thử lại.';
        loi.hidden = false; nut.disabled = false; nut.textContent = 'Mở nhóm đề';
        o.select();
      }
    });
    hien(n.ten, n.de.length + ' đề · ' + mucLuc.so_cau + ' câu mỗi đề', trangChu, [
      el('p', { class: 'gioi-thieu', text: n.mo_ta }), f
    ]);
    o.focus();
  }

  function trangDe(n) {
    var dl = moKhoa[n.id];
    var diem = docDiem();
    var ds = el('div', { class: 'ds' });
    n.de.forEach(function (d) {
      var cao = diem[d.id];
      ds.appendChild(el('button', { class: 'the', type: 'button', onclick: function () { batDau(n, d); } }, [
        el('div', { class: 'the-ten', text: d.ten }),
        el('div', { class: 'the-phu', text: mucLuc.so_cau + ' câu · ' + dl.de[d.id].filter(function (i) { return dl.cau[i].anh; }).length + ' câu có ảnh' }),
        cao != null ? el('div', { class: 'diem-cao', text: 'Điểm cao nhất: ' + cao + '/' + mucLuc.so_cau }) : null
      ]));
    });
    hien(n.ten, n.mo_ta, trangChu, [ds]);
  }

  /* ---------- lam bai ---------- */
  function batDau(n, d) {
    var dl = moKhoa[n.id];
    var bai = tron(dl.de[d.id]).map(function (i) {
      var c = dl.cau[i];
      var thuTu = tron([0, 1, 2, 3]);
      return { c: c, lc: thuTu.map(function (k) { return c.lc[k]; }), dung: thuTu.indexOf(0), chon: null };
    });
    cauHoi(n, d, bai, 0);
  }

  function hinh(c, dl, daTraLoi) {
    var a = dl.anh[c.anh];
    var img = el('img', { src: a.src, alt: daTraLoi ? c.alt_dap : 'Ảnh lâm sàng của câu hỏi' });
    var fig = el('figure', { class: a.nang && !daTraLoi ? 'che' : '' }, [
      el('div', { class: 'khung-anh' }, [img,
        el('button', { class: 'mo-anh', type: 'button', text: 'Hình lâm sàng nặng. Bấm để xem.', onclick: function () { fig.classList.remove('che'); } })
      ]),
      el('figcaption', {}, [ 'Ảnh: ' + a.tac_gia + ' · ' + a.gp + (a.sua ? ' · ' + a.sua : '') ])
    ]);
    if (daTraLoi) {
      var cap = fig.querySelector('figcaption');
      cap.appendChild(document.createTextNode(' · '));
      cap.appendChild(el('a', { href: a.trang, target: '_blank', rel: 'noopener', text: 'Nguồn ảnh' }));
    }
    return fig;
  }

  function cauHoi(n, d, bai, i) {
    var dl = moKhoa[n.id];
    var b = bai[i], c = b.c;
    var daDung = bai.filter(function (x) { return x.chon != null && x.chon === x.dung; }).length;
    var khungHinh = el('div');
    if (c.anh) khungHinh.appendChild(hinh(c, dl, false));
    var luaChon = el('div', { class: 'lua-chon', role: 'group', 'aria-label': 'Các lựa chọn' });
    var khuGiai = el('div', { 'aria-live': 'polite' });

    b.lc.forEach(function (t, k) {
      luaChon.appendChild(el('button', { class: 'lc', type: 'button', onclick: function () { chon(k); } }, [
        el('b', { text: CHU_LC[k] }), el('span', { text: t })
      ]));
    });

    function chon(k) {
      if (b.chon != null) return;
      b.chon = k;
      Array.prototype.forEach.call(luaChon.children, function (nut, j) {
        nut.disabled = true;
        if (j === b.dung) nut.classList.add('dung');
        else if (j === k) nut.classList.add('sai');
      });
      if (c.anh) { khungHinh.textContent = ''; khungHinh.appendChild(hinh(c, dl, true)); }
      var dung = k === b.dung;
      var nguon = el('div', { class: 'nguon' }, ['Nguồn: ']);
      c.nguon.forEach(function (ng, idx) {
        if (idx) nguon.appendChild(document.createTextNode(' · '));
        var s = dl.nguon[ng];
        nguon.appendChild(s.url ? el('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.ten }) : document.createTextNode(s.ten));
      });
      var cuoi = i === bai.length - 1;
      khuGiai.appendChild(el('div', { class: 'giai' }, [
        el('div', { class: 'giai-dau ' + (dung ? 'dung' : 'sai'), text: dung ? 'Đúng' : 'Chưa đúng. Đáp án: ' + CHU_LC[b.dung] + '. ' + b.lc[b.dung] }),
        el('div', { text: c.giai }), nguon
      ]));
      var nut = el('button', { class: 'nut', type: 'button', text: cuoi ? 'Xem kết quả' : 'Câu tiếp theo', onclick: function () {
        if (cuoi) ketQua(n, d, bai); else cauHoi(n, d, bai, i + 1);
      } });
      khuGiai.appendChild(el('div', { class: 'hang-nut' }, [nut]));
      nut.focus({ preventScroll: true });
      khuGiai.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    hien(d.ten, n.ten, function () {
      if (bai.every(function (x) { return x.chon == null; }) || confirm('Thoát đề này? Bài đang làm sẽ không được lưu.')) trangDe(n);
    }, [
      el('div', { class: 'tien', 'aria-hidden': 'true' }, [el('i', { style: 'width:' + (i * 100 / bai.length) + '%' })]),
      el('div', { class: 'tien-chu' }, [el('span', { text: 'Câu ' + (i + 1) + '/' + bai.length }), el('span', { text: 'Đúng ' + daDung })]),
      el('span', { class: 'dang-cau', text: c.dang }),
      el('p', { class: 'cau', text: c.hoi }),
      khungHinh, luaChon, khuGiai
    ]);
  }

  function ketQua(n, d, bai) {
    var dl = moKhoa[n.id];
    var dung = bai.filter(function (x) { return x.chon === x.dung; }).length;
    ghiDiem(d.id, dung);
    var sai = bai.filter(function (x) { return x.chon !== x.dung; });
    var nhanXet = dung >= 9 ? 'Rất tốt.' : dung >= 7 ? 'Khá, xem lại các câu sai bên dưới.' : dung >= 5 ? 'Cần ôn thêm các dấu hiệu dưới đây.' : 'Nên đọc lại phần lý thuyết rồi làm lại đề.';
    var onLai = el('div', { class: 'on-lai' });
    if (sai.length) onLai.appendChild(el('h2', { text: 'Câu cần xem lại (' + sai.length + ')' }));
    sai.forEach(function (x) {
      onLai.appendChild(el('article', {}, [
        el('div', { class: 'q', text: x.c.hoi }),
        x.c.anh ? el('img', { src: dl.anh[x.c.anh].src, alt: x.c.alt_dap }) : null,
        el('div', { class: 'a sai', text: 'Bạn chọn: ' + x.lc[x.chon] }),
        el('div', { class: 'a dung', text: 'Đáp án: ' + x.lc[x.dung] }),
        el('div', { class: 'e', text: x.c.giai })
      ]));
    });
    hien(d.ten, n.ten, function () { trangDe(n); }, [
      el('div', { class: 'ket-qua' }, [
        el('div', { class: 'ket-so', text: dung + '/' + bai.length }),
        el('div', { class: 'ket-chu', text: nhanXet }),
        el('div', { class: 'hang-nut', style: 'justify-content:center' }, [
          el('button', { class: 'nut', type: 'button', text: 'Làm lại đề này', onclick: function () { batDau(n, d); } }),
          el('button', { class: 'nut phu', type: 'button', text: 'Chọn đề khác', onclick: function () { trangDe(n); } })
        ])
      ]),
      onLai
    ]);
  }

  /* ---------- khoi dong ---------- */
  man.appendChild(el('div', { class: 'dang-tai', text: 'Đang tải...' }));
  fetch('data/muc_luc.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (m) {
    mucLuc = m;
    if (!window.crypto || !crypto.subtle) {
      man.textContent = '';
      man.appendChild(el('p', { class: 'loi', text: 'Trình duyệt này không hỗ trợ giải mã. Hãy mở bằng Chrome, Edge hoặc Safari bản mới.' }));
      return;
    }
    trangChu();
  }).catch(function () {
    man.textContent = '';
    man.appendChild(el('p', { class: 'loi', text: 'Không tải được danh sách đề. Kiểm tra kết nối mạng rồi tải lại trang.' }));
  });
})();
