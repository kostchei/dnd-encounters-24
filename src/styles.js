// styles.js - D&D Character Sheet themed styles
const styles = {
  container: {
    minHeight: '100vh',
    padding: '1rem',
    backgroundColor: 'var(--parchment)',
    color: 'var(--ink)',
    fontFamily: "'Crimson Text', Georgia, serif",
  },
  contentWrapper: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  innerContainer: {
    padding: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--dnd-red)',
    marginBottom: '1rem',
    borderBottom: '2px solid var(--dnd-red)',
    paddingBottom: '0.5rem',
  },

  // Region Hex Picker
  hexGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  hexOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    border: '2px solid transparent',
  },
  hexOptionSelected: {
    border: '2px solid var(--dnd-red)',
    boxShadow: '0 2px 8px rgba(88, 24, 13, 0.3)',
    transform: 'scale(1.05)',
  },
  hexLabel: {
    fontSize: '0.85rem',
    marginTop: '0.25rem',
    textAlign: 'center',
    color: 'var(--ink)',
  },

  // Party Configuration
  partyConfig: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  partyField: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 120px',
  },

  // Form Elements
  row: {
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '1rem',
    color: 'var(--dnd-red)',
    fontWeight: '600',
    minWidth: '110px',
  },
  select: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    backgroundColor: 'var(--parchment-dark)',
    color: 'var(--ink)',
    border: '1px solid var(--dnd-red)',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '140px',
  },
  numberInput: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    backgroundColor: 'var(--parchment-dark)',
    color: 'var(--ink)',
    border: '1px solid var(--dnd-red)',
    borderRadius: '4px',
    width: '80px',
    textAlign: 'center',
  },

  // Buttons
  generateButton: {
    padding: '0.875rem 2rem',
    fontSize: '1.1rem',
    backgroundColor: 'var(--dnd-red)',
    color: 'var(--parchment)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: "'Crimson Text', Georgia, serif",
    marginTop: '1rem',
    width: '100%',
    transition: 'background-color 0.2s',
  },

  // Results Display
  resultContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: 'var(--parchment-dark)',
    borderRadius: '8px',
    border: '1px solid var(--dnd-red)',
  },
  encounterResult: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--parchment)',
    borderRadius: '4px',
    border: '1px solid var(--gold)',
  },
  emphasis: {
    color: 'var(--dnd-red)',
    fontWeight: '600',
  },
  xpBudget: {
    fontSize: '1.1rem',
    color: 'var(--dnd-red)',
    fontWeight: '700',
    textAlign: 'center',
    padding: '0.75rem',
    backgroundColor: 'var(--parchment-dark)',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  appTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--dnd-red)',
    textAlign: 'center',
    marginBottom: '1.5rem',
    letterSpacing: '0.5px',
  },
  appTitleBottom: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--gold)',
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--dnd-red)',
    letterSpacing: '0.5px',
  },

  // Named participant roster - mobile friendly
  participantRoster: {
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
    paddingLeft: '0.75rem',
    borderLeft: '2px solid var(--gold)',
  },
  participantName: {
    fontSize: '0.9rem',
    color: 'var(--ink)',
    marginBottom: '0.15rem',
    lineHeight: '1.3',
  },
};

export default styles;