export const toHHMMSS = (x: number) => {

    const sec_num = Math.floor(x / 1000); // don't forget the second param
    let mSec=Math.floor(x-sec_num).toString();
    let hours = Math.floor(sec_num / 3600).toString();
    let minutes = Math.floor((sec_num - Number(hours) * 3600) / 60).toString();
    let seconds = (sec_num - Number(hours) * 3600 - Number(minutes) * 60).toString();

    if (hours.length < 2) {
        hours = '0' + hours;
    }
    if (minutes.length < 2) {
        minutes = '0' + minutes;
    }
    if (seconds.length < 2) {
        seconds = '0' + seconds;
    }
    if (mSec.length<2) {
        mSec = '00'+mSec
    }
    if (mSec.length<3) {
        mSec = '0'+mSec
    }
    return hours + ':' + minutes + ':' + seconds +':' +mSec ;
};
