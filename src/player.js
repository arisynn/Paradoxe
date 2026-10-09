export function getPlayer(){
  let player = JSON.parse(localStorage.getItem('paradoxe_player') || 'null');
  if(!player){
    player = { player_uid:'px_'+crypto.randomUUID(), username:'Guest_'+Math.floor(Math.random()*90000+10000), hint_balance:3 };
    localStorage.setItem('paradoxe_player', JSON.stringify(player));
  }
  return player;
}

export function updatePlayer(data){
  const player = {...getPlayer(), ...data};
  localStorage.setItem('paradoxe_player', JSON.stringify(player));
  return player;
}
