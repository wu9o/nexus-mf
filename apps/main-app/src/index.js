import('./bootstrap')
  .then(({ mount }) => {
    mount();
  })
  .catch((err) => {
    console.error('Error initializing main-app', err);
  });