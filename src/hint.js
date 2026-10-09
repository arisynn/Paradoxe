import {getPlayer, updatePlayer} from './player.js';

export function getHintBalance(){
 return getPlayer().hint_balance || 0;
}

export function useHint(){
 const player=getPlayer();
 if((player.hint_balance||0)<=0) return false;
 updatePlayer({hint_balance:player.hint_balance-1});
 return true;
}

export function addHint(amount=1){
 const player=getPlayer();
 updatePlayer({hint_balance:Math.min(5,(player.hint_balance||0)+amount)});
}
