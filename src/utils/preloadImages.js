async function preloadImages(cards) {
  // load 1st image first, then the rest in parallel.
  console.assert(
    cards.map((c) => !!c.imageUrl).every(Boolean),
    'One or more card options lack imgurl.'
  );
  await addImageProcess(cards[0].imageUrl);
  return new Promise((resolve, reject) => {
    const loadArr = [...cards]
      .splice(1)
      .map((card) => addImageProcess(card.imageUrl));
    Promise.all(loadArr)
      .then((values) => {
        console.log('slider', 'Images loaded', values);
        resolve();
      })
      .catch(() => {
        reject('Problem loading images.');
      });
    resolve();
  });

  function addImageProcess(src) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(true);
      img.onerror = reject;
      img.src = src;
    });
  }
}

export default preloadImages;
