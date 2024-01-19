package org.sergiorebelo.playground.rest.client;

public class ResponseData {
    private int count;

    private String name;

    private String gender;
    private float probability;


    // Getters and setters for each field

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public float getProbability() {
        return probability;
    }

    public void setProbability(float probability) {
        this.probability = probability;
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
