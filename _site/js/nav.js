// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.topbar nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Active page highlight
  var page = document.body.getAttribute('data-page');
  if (page) {
    var link = document.querySelector('.topbar nav a[data-page="' + page + '"]');
    if (link) link.classList.add('active');
  }
});
