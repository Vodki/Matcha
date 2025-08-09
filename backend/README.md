# API SPECIFICATION

## Authentication

### /register :
- POST : This endpoint expect a form-data that contains : username, password, email, first_name, last_name
If the request fulfills the conditions, an email will be send to the user


### /login
- POST : This endpoint expect a form-data that contain : username, password
If the request fulfills the conditions and the username/password is correct, a 200 code is returned and a cookie is set. This cookie is named session_token.
If the session_token isn't the one expected or is missing the backend will reject the requests



### /verify
- GET : This request verify the user

## Protected routes

You need to be authenticate to use these routes

### /tags

- GET: This endpoint return a code 200: {"tags":[{"id":1,"name":"go"}, ...]}
- POST: You need to put the tag in the query params. Assigns the tag to the user; 200 on success.
- DELETE: You need to put the tag in the query params. Removes tag assignment for the user; 200 on success