function nullDataHandler(transaction, results) {}
function errorHandler(transaction, error) {
  alert("There was an error (code " + error.code + "): " + error.message);
  return false;
}

function updateGrandTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('total').textContent = (result['total'] || 0) / 100.0;
}

function updateWeeklyTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('weekly_total').textContent = (result['total'] || 0) / 100.0;
}

function updateMonthlyTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('monthly_total').textContent = (result['total'] || 0) / 100.0;
}

function updateBreakdowns(transaction, results) {
  var breakdowns = document.getElementById('breakdowns');
  breakdowns.innerHTML = '';
  for (var i = 0; i < results.rows.length; i++) {
    var result = results.rows.item(i);
    var newBreakdown = document.createElement('tr');
    breakdowns.appendChild(newBreakdown);
    newBreakdown.innerHTML = '<th>' + result['spent_at_date'] + '</th><td>&pound;' + result['total'] / 100.0 + '</td>';
  }
}

function updatePage(transaction, results) {
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends', [], updateGrandTotal, errorHandler);
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime(\'now\', \'-7 days\', \'weekday 1\')', [], updateWeeklyTotal, errorHandler);
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime(\'now\', \'start of month\')', [], updateMonthlyTotal, errorHandler);
  transaction.executeSql('SELECT spent_at, date(spent_at) AS spent_at_date, SUM(amount) AS total FROM spends GROUP BY DATE(spent_at)', [], updateBreakdowns, errorHandler);
}

function addSpend() {
  var descriptionField = document.getElementById('description');
  var description = descriptionField.value;
  var amountField = document.getElementById('amount');
  var amount = amountField.value;
  if (parseFloat(amount) > 0) {
    var pence = amount * 100;
    db.transaction(function(t) {
      t.executeSql('INSERT INTO spends (amount, description) VALUES (?, ?)', [pence, description], updatePage, errorHandler);
    });
  }
  amountField.value = '';
  descriptionField.value = '';
  return false;
}

document.addEventListener("DOMContentLoaded", function() {
  if (!window.openDatabase) {
    alert('Spendthrift is not supported by your current browser.');
  } else {
    try {
      var db = openDatabase('spendthrift', '1.0', 'Spendthrift Database', 65536);
    } catch(e) {
      alert("Error opening database " + e);
    }
  }

  db.transaction(function(t) {
    t.executeSql('CREATE TABLE IF NOT EXISTS spends (id INTEGER PRIMARY KEY, amount INTEGER NOT NULL, description NVARCHAR, spent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);', [], nullDataHandler, errorHandler);
  });

  db.transaction(function(t) {
    updatePage(t);
  });
}, false);
