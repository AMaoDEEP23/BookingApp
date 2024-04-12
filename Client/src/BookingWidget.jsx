import { useContext, useState, useEffect } from "react";
import {differenceInCalendarDays } from "date-fns";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function BookingWidget(place) {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [numberOfGuests, setnumberOfGuests] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [redirect, setRedirect] = useState('');
    const {user} = useContext(UserContext)


    useEffect(() => {
        if (user){
            setName(user.name);
        }

    },[user])

    let numberOfNight = 0;
    if (checkIn && checkOut) {
    numberOfNight = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
 }

    async function bookThisPlace(){
        
        const response = await axios.post('https://bookingapp-r8rw.onrender.com/bookings', {
            checkIn, checkOut, numberOfGuests, phone, name,
            place:place.place._id,
            price:numberOfNight * place.place.price,
        }, {withCredentials: true});
        const bookingId = response.data._id;
        setRedirect(`/account/booking/${bookingId}`)
    }

    if(redirect){
        return <Navigate to = {redirect}/>
    }
   
    return (
        <div className="bg-white shadow p-4 rounded-2xl">
          <div className="text-2xl text-center">
            Price: ${place.place.price} / per night
          </div>
          <div className="border rounded-2xl mt-4">
            <div className="flex">
              <div className=" my-3  px-4 ">
                <label>Check in:</label>
                <input type="date" value={checkIn} onChange={ev => setCheckIn(ev.target.value)}/>
              </div>
              <div className=" my-3  px-4 ">
                <label>Check out:</label>
                <input type="date" value={checkOut} onChange={ev => setCheckOut(ev.target.value)}/>
              </div>
            </div>
            
            <div className="py-3 px-4 border-t">
                <label>Number of Guests:</label>
                <input type="Number" value={numberOfGuests} onChange={ev => setnumberOfGuests(ev.target.value)} />
              </div>
            {numberOfNight > 0 && (
                <div className="py-3 px-4 border-t">
                <label>Full name</label>
                <input type="text" value={name} onChange={ev => setName(ev.target.value)} />
                <label>Mobile number</label>
                <input type="tel" value={phone} onChange={ev => setPhone(ev.target.value)} />
              </div>
            
              
            )}
          </div>

          <button onClick={bookThisPlace}  className="primary mt-4">Book this place
          {numberOfNight > 0 && (
            <span>${numberOfNight * place.place.price}</span>
          )}
          </button>
        </div>
    );
}