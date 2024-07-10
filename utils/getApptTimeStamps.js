const getApptTimeStamps = function (startDateInfoArr, endDateInfoArr) {
  // dateInfoArr = [year, month (0 index), day, hour, minute]

  const startTimeStamp = new Date(...startDateInfoArr).getTime();
  const endTimeStamp = new Date(...endDateInfoArr).getTime();

  return [startTimeStamp, endTimeStamp];
};

export default getApptTimeStamps;
