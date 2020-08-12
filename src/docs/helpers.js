import React from 'react';

function randomNumber(max) {
  return Math.round(Math.random() * max);
}

function randomIndex(list, lastIndex) {
  const index = randomNumber(list.length - 1);
  if (lastIndex != null && index === lastIndex) {
    return randomIndex(list, lastIndex);
  } else {
    return index;
  }
}

export function randomElement(list, lastIndex) {
  const index = randomNumber(list.length);
  if (lastIndex != null && index === lastIndex) {
    return randomElement(list, lastIndex);
  } else {
    return list[index];
  }
}

export function useRandomIndex(list) {
  const [index, setIndex] = React.useState(
    () => randomNumber(list.length - 1)
  );

  return () => {
    const i = randomIndex(list, index);
    setIndex(i);
    return i;
  };
}
