/**
 * Estimate wait time for a patient in the queue.
 * @param {number} patientSerial - The patient's serial number
 * @param {number} currentSerial - The doctor's current serial number
 * @param {number} avgConsultTime - Average consultation time in minutes
 * @returns {object} - { estimatedMinutes, position }
 */
const estimateWaitTime = (patientSerial, currentSerial, avgConsultTime = 10) => {
  const position = Math.max(0, patientSerial - currentSerial);
  const estimatedMinutes = position * avgConsultTime;

  return {
    position,
    estimatedMinutes,
    estimatedText: position === 0
      ? 'Your turn now!'
      : position === 1
        ? 'You are next!'
        : `~${estimatedMinutes} minutes (${position} patients ahead)`
  };
};

module.exports = { estimateWaitTime };
