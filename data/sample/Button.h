#pragma once
#include <iostream>
#include "Misc.h"
#include "AbstractButton.h"

using namespace std;
class Button : public AbstractButton
{
public:
	Button();
	Button(string name);
	bool eventHandler(ActionEvent) override;
protected:

};