import React from 'react';

export function Toast({ message, visible }) {
  return (
    <div className={'toast' + (visible ? ' show' : '')}>{message}</div>
  );
}
