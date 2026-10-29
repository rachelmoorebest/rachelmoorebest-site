// Contact form. GitHub Pages can't receive form posts, so messages go through
// Web3Forms (data-endpoint), which emails each one to the address tied to
// data-access-key. While the key is empty, Submit opens the visitor's email
// app with the message filled in instead.
(function () {
  var form = document.getElementById('contact-form');
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var d = new FormData(form);
    var name = (d.get('fname') + ' ' + d.get('lname')).trim();
    var subject = 'Website inquiry from ' + name;
    var key = form.dataset.accessKey;

    if (!key) {
      var body = d.get('message') + '\n\n' + name + '\n' + d.get('email');
      window.location.href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      return;
    }

    // Web3Forms replies to the "email" field and rejects anything with botcheck set.
    var payload = {
      access_key: key,
      subject: subject,
      from_name: 'rachelmoorebest.com',
      name: name,
      email: d.get('email'),
      message: d.get('message')
    };
    if (d.get('botcheck')) payload.botcheck = true;

    button.disabled = true;
    status.textContent = '';

    fetch(form.dataset.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = 'Thank you!';
      })
      .catch(function () {
        status.textContent = 'Sorry, that didn’t send. Please email ' + form.dataset.mailto + '.';
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
