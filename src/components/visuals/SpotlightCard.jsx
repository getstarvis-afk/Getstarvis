import { useRef } from 'react';

/**
 * Wrapper that lights up its border under the cursor (the Linear/Clay effect).
 * Pair the `.spotlight` class with any glass/bordered surface.
 */
export default function SpotlightCard({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <Tag ref={ref} onMouseMove={handleMove} className={`spotlight ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
