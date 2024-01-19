package org.sergiorebelo.playground.rest.client;

public class ResponseData {
    private int count;

    private String name;

    private String gender;
    private float probability;


    // Getters and setters for each field


    public String getGender() {
        return gender;
    }



    // Optionally, override toString(), equals(), and hashCode() methods


    @Override
    public String toString() {
        return "ResponseData{" +
                "count=" + count +
                ", name='" + name + '\'' +
                ", gender='" + gender + '\'' +
                ", probability=" + probability +
                '}';
    }
}
