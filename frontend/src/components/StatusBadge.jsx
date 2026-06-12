const StatusBadge = ({ status }) => {
  const labels = {
    waiting: 'Waiting',
    currently_examining: 'Examining',
    done: 'Done',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`status-badge ${status}`}>
      <span className={`status-dot ${status}`}></span>
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
