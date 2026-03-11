// Constructs page pill filtering
document.addEventListener('DOMContentLoaded', function () {
  var table = document.getElementById('constructs-table');
  if (!table) return;

  var rows = table.querySelectorAll('tbody tr');
  var categories = new Set();

  rows.forEach(function (row) {
    var cat = row.getAttribute('data-category');
    if (cat) categories.add(cat);
  });

  var filterContainer = document.getElementById('construct-filters');
  if (!filterContainer) return;

  // "All" pill
  var allPill = document.createElement('button');
  allPill.className = 'pill active';
  allPill.textContent = 'All';
  allPill.addEventListener('click', function () { filterRows('all'); });
  filterContainer.appendChild(allPill);

  // Category pills
  Array.from(categories).sort().forEach(function (cat) {
    var pill = document.createElement('button');
    pill.className = 'pill';
    pill.textContent = cat;
    pill.addEventListener('click', function () { filterRows(cat); });
    filterContainer.appendChild(pill);
  });

  function filterRows(category) {
    document.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
    event.target.classList.add('active');

    rows.forEach(function (row) {
      if (category === 'all' || row.getAttribute('data-category') === category) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
});
