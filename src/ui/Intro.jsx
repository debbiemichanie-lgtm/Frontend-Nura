export default function Intro({ title, children }) {
  return (
    <section style={{
      background:'rgba(80,189,189,.08)',
      border:'1px solid #e5e7eb',
      borderRadius:16,
      padding:'18px 18px 14px',
      margin:'10px 0 22px'
    }}>
      <h2 style={{margin:'0 0 10px', fontSize:22}}>{title}</h2>
      <div style={{color:'#374151', lineHeight:1.5}}>{children}</div>
    </section>
  );
}
