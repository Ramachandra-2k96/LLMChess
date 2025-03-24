'use client';

import ChessGame from '../components/ChessGame';
import styles from '../styles/page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Chess Game vs AI</h1>
      <p className={styles.description}>
        Play chess against the computer! You control the white pieces.
      </p>
      <ChessGame />
    </main>
  );
}
