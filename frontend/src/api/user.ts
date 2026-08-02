import axios from "axios";

import type {User} from "../types/user";


const request =
axios.create({

    baseURL:
    "http://localhost:8000"

});



export function getUsers(){

    return request.get<User[]>(
        "/users/all"
    );

}



export function createUser(
    data:{
        name:string;
        email:string;
    }
){

    return request.post(
        "/users/create",
        data
    );

}



export function deleteUser(
    id:number
){

    return request.delete(
        `/users/${id}`
    );

}