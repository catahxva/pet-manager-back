const getApptTimeStamps = function (startDateInfoArr, endDateInfoArr) {
  // dateInfoArr = [year, month (0 index), day, hour, minute]

  const startTimeStamp = startDateInfoArr
    ? new Date(...startDateInfoArr).getTime()
    : null;
  const endTimeStamp = endDateInfoArr
    ? new Date(...endDateInfoArr).getTime()
    : null;

  return [startTimeStamp, endTimeStamp];
};

export default getApptTimeStamps;
