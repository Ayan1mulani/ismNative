import moment from 'moment';
import { Common } from './Common';

const Util = {
  showMessage: (message, type, conf) => {
    if(typeof message === 'object'){
      let mm = ''
      message.forEach(m=>{
        mm += m+' |'
      })
      message = mm
    }

  },
  signUrl: (link)=>{ 
    let user = Common.getLoggedInUser()
    if(user){
      return `${link}?api-token=${user.api_token}&user-id=${user.id}`;
    }
    Util.showMessage('Unauthorized!!')
  },
  getTimeByTimeZone :(dateTime, format)=>{
    try{
      if(!format){
        format='llll'

      }
      let user = Common.getLoggedInUser()
      if(user && user.society && user.society.data){
        let data = JSON.parse(user.society.data)
        if(data.timezone && data.timezone.offset){ 
          let offset = data.timezone.offset
          let localTime = moment(dateTime).add(offset, 'minutes')
          return localTime.format(format)
        }
      }
    }catch(e){
      console.error(e)
    }
    return moment(dateTime).format(format);
  },
  getCommonAuth :async()=>{
    let user = await Common.getLoggedInUser()
    if(user){
      return {
      "Content-Type": "application/json",
      }
    }
  }
}
export {Util};