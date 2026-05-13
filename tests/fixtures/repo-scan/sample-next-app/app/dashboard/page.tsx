'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        count: {count}
      </button>
    </div>
  );
}
