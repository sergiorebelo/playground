package org.sergiorebelo.playground.rest.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.sergiorebelo.playground.NameInformationService;

import java.util.Optional;

@ApplicationScoped
public class GreetingService {


    @Inject
    private NameInformationService nameInformationService;


    public String greeting(String name) {
        String gender = nameInformationService.getGender(name).getDisplayName();
        return "Hello " + name + ". Do you identify as " + Optional.ofNullable(gender).orElse("non binary") + "?";
    }

    private String getGender(String name) {
        return nameInformationService.getGender(name).getDisplayName();
    }

}
