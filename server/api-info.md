Backend:

​	Socket_id -> user_id

​	user_id -> 

​					socket_id (ensure only one)

​					room

​					Alive
​				  
				  role 

​	room-> started, board, list of sockets

API: 

​	Backend to frontend:

​		Start game, role: create a game

​		update board, board

​		end game, winner

​	Frontend to backend:

​		Connect (send userid) (join room if necessary)

​		Start game: start game in room

​		Update board, board

​		Die

 

Connect:

​	Connect; if in started room