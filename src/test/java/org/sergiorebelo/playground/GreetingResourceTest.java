package org.sergiorebelo.playground;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
class GreetingResourceTest {
    @Test
    void testHelloEndpoint() {
        given()
                .when().get("/hello")
                .then()
                .statusCode(200)
                .body(is("Hello stranger"));
    }

    @Test
    void testHelloEndpointWithMaleName() {
        given()
                .when().get("/hello/John")
                .then()
                .statusCode(200)
                .body(is("Hello John. Do you identify as male?"));
    }

    @Test
    void testHelloEndpointWithFemaleName() {
        given()
                .when().get("/hello/Mary")
                .then()
                .statusCode(200)
                .body(is("Hello Mary. Do you identify as female?"));
    }

    @Test
    void testHelloEndpointWithStrangeName() {
        given()
                .when().get("/hello/zzz123")
                .then()
                .statusCode(200)
                .body(is("Hello zzz123. Do you identify as non binary?"));
    }
}