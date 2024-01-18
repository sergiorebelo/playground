package org.sergiorebelo.playground.rest.client;

//      {
//        "id": 123,
//        "name": "Example Name",
//        "status": "Active"
//        }


public class ResponseData {

    private int id;
    private String name;
    private String status;

    // Getters and setters for each field

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // Optionally, override toString(), equals(), and hashCode() methods


}
