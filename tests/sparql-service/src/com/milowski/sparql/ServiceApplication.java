/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.milowski.sparql;

import org.restlet.Application;
import org.restlet.Restlet;
import org.restlet.routing.Router;

/**
 *
 * @author alex
 */
public class ServiceApplication extends Application {
   
   public Restlet createInboundRoot() {
      Router router = new Router(getContext());
      router.attach("/new",NewContextResource.class);
      return router;
   }
   
}
