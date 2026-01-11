import styles from '@/styles/components/spinner.module.scss';

export default function Spinner() {
  return <span className={styles.spinner} aria-label="loading" />;
}
