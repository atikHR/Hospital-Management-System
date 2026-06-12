import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('/', {
      transports: ['websocket', 'polling'],
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinPatientRoom = (patientId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_patient_room', patientId);
    }
  };

  const joinDoctorQueue = (doctorId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_doctor_queue', doctorId);
    }
  };

  const onStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('status_update', callback);
    }
  };

  const onQueueMoved = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('queue_moved', callback);
    }
  };

  const onDoctorAnnouncement = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('doctor_announcement', callback);
    }
  };

  const onDoctorChamberUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('doctor_chamber_update', callback);
    }
  };

  const onDoctorChamberTimeUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('doctor_chamber_time_update', callback);
    }
  };

  const offStatusUpdate = () => {
    if (socketRef.current) {
      socketRef.current.off('status_update');
    }
  };

  const offQueueMoved = () => {
    if (socketRef.current) {
      socketRef.current.off('queue_moved');
    }
  };

  const offDoctorAnnouncement = () => {
    if (socketRef.current) {
      socketRef.current.off('doctor_announcement');
    }
  };

  const offDoctorChamberUpdate = () => {
    if (socketRef.current) {
      socketRef.current.off('doctor_chamber_update');
    }
  };

  const offDoctorChamberTimeUpdate = () => {
    if (socketRef.current) {
      socketRef.current.off('doctor_chamber_time_update');
    }
  };

  return {
    socket: socketRef.current,
    joinPatientRoom,
    joinDoctorQueue,
    onStatusUpdate,
    onQueueMoved,
    onDoctorAnnouncement,
    onDoctorChamberUpdate,
    onDoctorChamberTimeUpdate,
    offStatusUpdate,
    offQueueMoved,
    offDoctorAnnouncement,
    offDoctorChamberUpdate,
    offDoctorChamberTimeUpdate,
  };
};

export default useSocket;
